var express = require('express');
var router = express.Router();
const db = require('../../db/db');

router.get('/products', async (req, res) => {
  try {
    const rows = await db.getAllProducts();
    res.json(rows);
  } catch (err) {
    console.error("Database query error:", err.message);
    res.status(500).json({ error: 'Kunde inte hämta produkterna' });
  }
});

router.delete('/products/:id', async (req, res) => {
  const { id } = req.params; 

  try {
    // Cette fonctionnalité n'est pas encore implémentée dans notre interface unifiée
    // Nous devons l'ajouter à db.js
    if (db.useMongo) {
      const result = await db.deleteProduct(id);
      if (!result) {
        return res.status(404).json({ error: 'Produkten kunde inte hittas' });
      }
      return res.status(200).json({ message: 'Lyckades radera produkten' });
    } else {
      // Fallback vers SQLite pour le moment
      const result = await new Promise((resolve, reject) => {
        db.sqlite.run('DELETE FROM products WHERE id = ?', [id], function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
      });
      
      if (result === 0) {
        return res.status(404).json({ error: 'Produkten kunde inte hittas' });
      }
      return res.status(200).json({ message: 'Lyckades radera produkten' });
    }
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: 'Misslyckades med att radera produkten' });
  }
});

module.exports = router;