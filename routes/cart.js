const express = require('express');
const router = express.Router();
const db = require('../db/db');

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
router.get('/cartAPI', (req, res) => {
  const sql = `
    SELECT 
      cart_items.id AS cart_id,
      cart_items.quantity,
      cart_items.product_id,
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
module.exports = router;
