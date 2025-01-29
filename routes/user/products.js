var express = require('express');
var router = express.Router();
const db = require('../../db/db');

// Middleware principal pour la page d'accueil
router.get('/', (req, res) => {
  console.log('Utilisateur connecté (req.user) :', req.user);

  db.all('SELECT * FROM products', (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des produits :', err);
      return res.status(500).send('Erreur de base de données.');
    }

    // Rendre la vue avec les produits et les données utilisateur
    res.render('index', {
      title: 'SkandiWall',
      products: rows,
      firstname: req.user?.first_name || 'gäst' ,
      lastname: req.user?.last_name || '',
      userId: req.user?.id || null, // Si req.user est undefined, userId sera null
    });
  });
});
router.get('/products/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const mainProductSql = 'SELECT id, name, price, image, slugs FROM products WHERE slugs = ?';

  db.get(mainProductSql, [slug], (err, product) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err);
      return res.status(500).send('Erreur de base de données.');
    }

    if (product) {
      res.render('product-details', { product });
    } else {
      res.status(404).send('Produit introuvable');
    }
  });
});

module.exports = router;