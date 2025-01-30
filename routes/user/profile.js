const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../../db/db');
const { checkAuthenticated } = require('../../middleware/auth');
const { checkNotAuthenticated } = require('../../middleware/auth'); 


// Middleware pour gérer les corps de requête
router.use(express.urlencoded({ extended: false }));
router.get('/', checkAuthenticated, (req, res) => {
  console.log('req.user.first_name CHECK CAAA', req.user.first_name)
  res.render('index', { firstname: req.user.first_name, lastname: req.user.last_name });

});


router.get('/shoppingCart', checkAuthenticated, (req, res) => {
  res.render('shoppingCart', { firstname: req.user.first_name, lastname: req.user.last_name });
});
router.get('/orders', checkAuthenticated, (req, res) => {
  res.render('order-index', { firstname: req.user.first_name, lastname: req.user.last_name });
});

// GET /login : Affiche la page de connexion
router.get('/login', checkNotAuthenticated, (req, res) => {
  const messages = req.query.sessionExpired
    ? { expired: 'Votre session a expiré. Veuillez vous reconnecter.' }
    : {};
  res.render('users/login', { messages: {},  userId: req.user?.id || null,
  }); // Passe un objet vide par défaut
});

router.post('/login', checkNotAuthenticated, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Erreur pendant l\'authentification :', err);
      return next(err);
    }

    if (!user) {
      console.log('Authentification échouée :', info?.message || 'Utilisateur introuvable.');
      return res.render('users/login', { 
        messages: { error: info?.message || 'Email ou mot de passe incorrect' }
      });
    }

    req.logIn(user, (err) => {
      if (err) {
          console.error('Erreur lors de l\'enregistrement de la session :', err);
          return next(err);
      }
  
      // Assigner l'ID de l'utilisateur à la session
      req.session.userId = user.id; // IMPORTANT
      console.log('Utilisateur connecté avec succès, ID :', user.id, 'Session userId :', req.session.userId);
  
      // Charger le panier existant de l'utilisateur depuis la base de données
      db.all('SELECT * FROM cart_items WHERE user_id = ?', [user.id], (err, rows) => {
          if (err) {
              console.error('Erreur lors du chargement du panier :', err);
              return next(err);
          }
  
          // Synchroniser le panier chargé avec la session
          req.session.cart = rows.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price,
          }));
  
          console.log('Panier chargé depuis la base de données pour l\'utilisateur', user.id);
          return res.redirect('/'); // Redirection après connexion
      });
  });
  })(req, res, next);
});

// GET /register : Affiche la page d'inscription
router.get('/register', checkNotAuthenticated, (req, res) => {
  res.render('users/register');
});

// POST /register : Traite les informations d'inscription
router.post('/register', checkNotAuthenticated, async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const { first_name, last_name, email } = req.body;

    // Insérer l'utilisateur dans la base de données
    db.run(
      `INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)`,
      [first_name, last_name, email, hashedPassword],
      function (err) {
        if (err) {
          console.error("Erreur lors de l'inscription :", err.message);
          return res.redirect('/profile/register');
        }

        console.log('Utilisateur inscrit avec succès, ID :', this.lastID);

        // Simuler une authentification automatique
        req.body.email = email; // Injecter les informations pour Passport
        req.body.password = req.body.password; // Repasser le mot de passe pour l'authentification

        passport.authenticate('local', (err, user, info) => {
          if (err) {
            console.error('Erreur lors de l\'authentification automatique :', err);
            return next(err);
          }

          if (!user) {
            console.error('Authentification automatique échouée après inscription.');
            return res.redirect('/profile/login');
          }

          req.logIn(user, (err) => {
            if (err) {
              console.error("Erreur lors de la connexion automatique après inscription :", err);
              return next(err);
            }

            console.log('Utilisateur inscrit et connecté avec succès :', req.user);
            return res.redirect('/'); // Rediriger après inscription et connexion
          });
        })(req, res, next); // Important : passez req, res, next à passport.authenticate
      }
    );
  } catch (err) {
    console.error("Erreur lors de l'inscription :", err);
    res.redirect('/profile/register');
  }
});
// DELETE /logout : Déconnecte l'utilisateur
router.delete('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion :", err);
      return next(err);
    }
    res.redirect('/profile/login');
  });
});

router.get('/logout', (req, res) => {
  const user_id = req.user ? req.user.id : null;

  if (user_id && req.session.cart && req.session.cart.length > 0) {
    // Sauvegarder les articles du panier en session dans la base de données
    const savePromises = req.session.cart.map((item) => {
      return new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO cart_items (user_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(product_id, user_id)
          DO UPDATE SET quantity = excluded.quantity`,
          [user_id, item.product_id, item.quantity, item.price],
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    });
console.log('voici req.session.cart.map : ', savePromises)
    Promise.all(savePromises)
      .then(() => {
        console.log('Panier sauvegardé dans la base de données pour l\'utilisateur', user_id);

        // Vider le panier en session uniquement après la sauvegarde réussie
        req.session.cart = [];
        console.log('Panier en session vidé. Voici req.session.cart : ', req.session.cart);

        // Détruire la session
        req.session.destroy((err) => {
          if (err) {
            console.error('Erreur lors de la destruction de la session :', err);
            return res.status(500).send('Erreur lors de la déconnexion.');
          }
          res.clearCookie('connect.sid'); // Supprimer le cookie de session
          res.redirect('/profile/login'); // Rediriger vers la page de connexion
        });
      })
      .catch((err) => {
        console.error('Erreur lors de la sauvegarde du panier avant déconnexion :', err);
        res.status(500).send('Erreur interne du serveur.');
      });
  } else {
    console.log('Aucun article à sauvegarder ou utilisateur non connecté.');

    // Si aucun article à sauvegarder, réinitialiser directement la session
    req.session.cart = [];
    req.session.destroy((err) => {
      if (err) {
        console.error('Erreur lors de la destruction de la session :', err);
        return res.status(500).send('Erreur lors de la déconnexion.');
      }
      res.clearCookie('connect.sid'); // Supprimer le cookie de session
      res.redirect('/profile/login'); // Rediriger vers la page de connexion
    });
  }
});

router.get('/api/isAuthenticated', (req, res) => {
  console.log('isAutreq.session.carthenticated:', req.isAuthenticated);
  console.log('Vérification d\'authentification :', req.isAuthenticated());
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});


module.exports = router;