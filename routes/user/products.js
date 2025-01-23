var express = require('express');
var router = express.Router();
const db = require('../../db/db');

/* GET home page. */
router.get('/', function(req, res, next) {
  db.all('SELECT * FROM products', (err, rows) => {  // Hämtar alla produkter från databasen
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    // Skickar produkterna till vyn
    res.render('index', { title: 'SkandiWall', products: rows });
  });
});



router.get('/products/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const mainProductSql = 'SELECT id, name, price, image, slugs FROM products WHERE slugs = ?';
  db.get(mainProductSql, [slug], (err, product) => {
    if (err) {
      console.error("Error fetching product:", err);
      res.status(500).send("Internal Server Error");
    } else if (product) {
      res.render('product-details', { product });
    } else {
      res.status(404).send('Product not found');
    }
  });
});

module.exports = router;
