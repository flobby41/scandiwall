var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./db/skandiWall.db'); // Korrekt filväg

/* GET product details page. */
router.get('/:id', function(req, res, next) {
  var id = req.params.id; // Hämta produktens ID från URL
  var query = 'SELECT * FROM products WHERE id = ?'; // SQL-fråga för att hämta produkt baserat på id
  
  db.get(query, [id], (err, product) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    if (!product) {
      return res.status(404).send('Product not found');
    }
    // Skickar produktens detaljer till vyn
    res.render('product-details', { title: 'Product Details', product: product });
  });
});

module.exports = router;
