var express = require('express');
var router = express.Router();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/skandiWall.db');

router.get('/products', (req, res) => {

  db.all(
    `SELECT 
      id,
      name,
      description,
      price,
      stock_quantity,
      image,
      category,
      created_at,
      slugs
    FROM products`,
    [],

    (err, rows) => {
      if (err) {
        console.error("Database query error:", err.message); // Log error details
        res.status(500).json({ error: 'Kunde inte hämta produkterna' });
      } else {
        res.json(rows);
      }
    }
  );
});


router.delete('/products/:id', (req, res) => {
  const { id } = req.params; 

  db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: 'Misslyckades med att radera produkten' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Produkten kunde inte hittas' });
    } else {
      res.status(200).json({ message: 'Lyckades radera produkten' });
    }
  });
});

module.exports = router;