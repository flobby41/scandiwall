var express = require('express');
var router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/skandiWall.db');

// GET /api/products
router.get('/', (req, res)=>{
  const sql = 'SELECT * FROM products';
  db.all(sql, [], (err, products) => {
    if (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(products); // Retourne les produits en JSON
    }
  });
});
// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: 'Misslyckades med att radera produkten' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Produkten kunde inte hittas' });
    } else {
      res.status(200).json({ message: 'Product deleted successfully' });
    }
  });
});

module.exports = router;
