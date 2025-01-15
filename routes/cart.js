const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /admin/cart : Récupère tous les produits dans le panier
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
      console.error("Erreur lors de la récupération des produits :", err);
      return res.status(500).send("Erreur interne du serveur");
    }
    console.log("Produits dans le panier :", rows); // Log des résultats
    res.json(rows);
  });
});


router.post('/cartAPI', (req, res) => {
  const { product_id, quantity, price } = req.body;
  const userId = req.session.userId;

  const checkQuery = 'SELECT * FROM cart_items WHERE product_id = ? AND user_id = ?';
  db.get(checkQuery, [product_id, userId], (err, row) => {
    if (err) {
      console.error("Erreur lors de la vérification :", err);
      return res.status(500).json({ error: "Erreur interne." });
    }

    if (row) {
      const updateQuery = 'UPDATE cart_items SET quantity = quantity + ? WHERE product_id = ? AND user_id = ?';
      db.run(updateQuery, [quantity, product_id, userId], function (err) {
        if (err) {
          console.error("Erreur lors de la mise à jour :", err);
          return res.status(500).json({ error: "Erreur lors de la mise à jour du panier." });
        }
        return res.status(200).json({ message: "Quantité mise à jour." });
      });
    } else {
      const insertQuery = `INSERT INTO cart_items (product_id, quantity, price, user_id) VALUES (?, ?, ?, ?)`;
      db.run(insertQuery, [product_id, quantity, price, userId], function (err) {
        if (err) {
          console.error("Erreur lors de l'insertion :", err);
          return res.status(500).json({ error: "Erreur lors de l'ajout au panier." });
        }
        return res.status(201).json({ message: "Produit ajouté au panier." });
      });
    }
  });
});
// DELETE /admin/cart/:id : Supprime un produit du panier
router.delete('/:id', (req, res) => {
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
router.put('/:id', (req, res) => {
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
