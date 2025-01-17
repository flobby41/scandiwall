const express = require('express');
const router = express.Router();
const db = require('../db/db');


// Route pour afficher le panier de l'utilisateur
router.get('/shoppingCart', (req, res) => {
  res.render('shoppingCart');
});

router.get('/cartAPI', (req, res) => {
  const sql = `
    SELECT 
      cart_items.id AS cart_id,
      cart_items.quantity,
      cart_items.product_id,
      cart_items.price,
      cart_items.user_id,
      products.name,
      products.image
    FROM 
      cart_items
    INNER JOIN 
      products
    ON 
      cart_items.product_id = products.id;
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des produits :', err);
      return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }

    res.json(rows);
  });
});

// GET /admin/cart/:id : Récupère un produit spécifique
router.get('/cartAPI/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const sql = 'SELECT * FROM cart_items WHERE id = ?';

  db.get(sql, [productId], (err, product) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }
    res.json(product);
  });
});
// Add product to cart
router.post('/cartAPI', (req, res) => {
  const { product_id, user_id, quantity, price } = req.body;

  // Use default user_id if not provided
  const defaultUserId = 1; // Replace with a valid ID for testing
  const finalUserId = user_id || defaultUserId;

  if (!product_id || !quantity || !price) {
    return res.status(400).json({ error: 'product_id and quantity are required.' });
  }

  const sql = `
    INSERT INTO cart_items (product_id, user_id, quantity, price)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(product_id, user_id) 
    DO UPDATE SET quantity = quantity + excluded.quantity;
  `;

  db.run(sql, [product_id, finalUserId, quantity, price], function (err) {
    if (err) {
      console.error('Error adding/updating product in cart:', err);
      return res.status(500).json({ error: 'Internal server error.' });
    }

    return res.status(200).json({
      message: 'Product successfully added/updated in the cart.',
      changes: this.changes,
    });
  });
});
// Endpoint pour récupérer les produits du panier


// DELETE /admin/cart/:id : Supprime un produit du panier
router.delete('/cartAPI/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const sql = 'DELETE FROM cart_items WHERE id = ?';

  db.run(sql, [productId], function (err) {
    if (err) {
      console.error("Erreur lors de la suppression du produit :", err);
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }
    res.status(200).json({ message: "Produit supprimé avec succès" });
  });
});

// PUT /admin/cart/:id : Met à jour la quantité d'un produit
router.put('/cartAPI/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const { change } = req.body;

  if (!change || typeof change !== 'number') {
    return res.status(400).json({ error: 'Invalid quantity change' });
  }

  const sqlSelect = 'SELECT * FROM cart_items WHERE id = ?';
  db.get(sqlSelect, [productId], (err, product) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err);
      return res.status(500).json({ error: 'Erreur interne du serveur' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    const updatedQuantity = product.quantity + change;
    if (updatedQuantity <= 0) {
      // Supprimer le produit si la quantité est <= 0
      const sqlDelete = 'DELETE FROM cart_items WHERE id = ?';
      db.run(sqlDelete, [productId], (err) => {
        if (err) {
          console.error('Erreur lors de la suppression du produit :', err);
          return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        return res.status(200).json({ message: 'Produit supprimé du panier' });
      });
    } else {
      // Mettre à jour la quantité si elle est > 0
      const sqlUpdate = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
      db.run(sqlUpdate, [updatedQuantity, productId], (err) => {
        if (err) {
          console.error('Erreur lors de la mise à jour de la quantité :', err);
          return res.status(500).json({ error: 'Erreur interne du serveur' });
        }
        res.status(200).json({ message: 'Quantité mise à jour avec succès', updatedQuantity });
      });
    }
  });
});

module.exports = router;
