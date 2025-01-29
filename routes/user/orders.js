const express = require('express');
const router = express.Router();
const path = require('path')
const db = require('../../db/db');
const { checkAuthenticated } = require('../../middleware/auth'); // Assurez-vous d'avoir un middleware d'authentification

//user
router.get('/orders', (req, res) => {
  res.render('orders', { userId: req.user?.id || null });

});


// Route dynamique pour /orders/confirmation
router.get('/orders/confirmation', (req, res) => {
  const orderId = req.query.orderId; // Récupère orderId depuis la chaîne de requête
  if (!orderId) {
      return res.status(400).send('Order ID manquant.'); // Gère le cas où orderId est absent
  }
  // Si tout va bien, renvoyer la page confirmation.html
  res.sendFile(path.join(process.cwd(), 'views/confirmation.html')); // Adaptez le chemin
});


//json products
router.get('/api/orders', (req, res)=>{
  const sql = 'SELECT * FROM orders';
  db.all(sql, [], (err, products) => {
    if (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(products); // Retourne les produits en JSON
    }
  });
});

router.get('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id); // Récupérer l'ID depuis l'URL
  const sql = 'SELECT * FROM orders WHERE id = ?'; // Requête SQL pour obtenir un produit spécifique
  const params = [orderId];
console.log('params', params)
  db.get(sql, params, (err, order) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err);
      res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
    } else if (!order) {
      res.status(404).json({ error: 'Produit introuvable' });
    } else {
      res.json(order); // Retourner le produit trouvé
    }
  });
});


// Route POST pour confirmer une commande
router.post('/api/orders', (req, res) => {
  const user_id = req.session.userId ? req.session.userId : 0; // 0 pour les invités
  const { cartItems, total_price } = req.body;

  if (!cartItems || cartItems.length === 0 || typeof total_price !== 'number') {
      console.error('Erreur : Paramètres manquants ou invalides.');
      return res.status(400).json({ error: 'Paramètres manquants ou invalides.' });
  }

  const orderQuery = `INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, 'pending')`;
  db.run(orderQuery, [user_id, total_price], function (err) {
      if (err) {
          console.error('Erreur lors de la création de la commande :', err);
          return res.status(500).json({ error: 'Erreur interne du serveur.' });
      }

      const orderId = this.lastID;
      console.log('Commande insérée avec succès. ID de la commande :', orderId);

      const itemQuery = `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`;
      const itemPromises = cartItems.map(item => {
          return new Promise((resolve, reject) => {
              db.run(itemQuery, [orderId, item.product_id, item.quantity, item.price], (err) => {
                  if (err) reject(err);
                  else resolve();
              });
          });
      });

      Promise.all(itemPromises)
          .then(() => {
              if (user_id === 0) {
                  // Pour les invités : vider uniquement le panier en session
                  console.log('Panier en session avant suppression (invité) :', req.session.cart);
                  req.session.cart = [];
                  console.log('Panier en session après suppression (invité) :', req.session.cart);
                  console.log('Panier invité vidé avec succès.');
              } else {
                  // Pour les utilisateurs connectés : vider le panier en session et dans la base de données
                  console.log('Panier en session avant suppression (utilisateur) :', req.session.cart);

                  const deleteQuery = `DELETE FROM cart_items WHERE user_id = ?`;
                  db.run(deleteQuery, [user_id], (err) => {
                      if (err) {
                          console.error('Erreur lors de la suppression des articles du panier :', err);
                          return res.status(500).json({ error: 'Erreur interne du serveur.' });
                      }
                      req.session.cart = [];
 console.log('Panier en session après suppression (utilisateur) :', req.session.cart);
        console.log(`Panier vidé dans la base de données pour l'utilisateur ${user_id}`);                  });
              }

              res.status(201).json({
                  message: 'Commande confirmée avec succès !',
                  orderId: orderId,
              });
          })
          .catch(err => {
              console.error('Erreur lors de l’ajout des articles à la commande :', err);
              res.status(500).json({ error: 'Erreur interne du serveur.' });
          });
  });
});

module.exports = router;
