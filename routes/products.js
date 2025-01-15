var express = require('express');
var router = express.Router();
const db = require('../db/db');


/* GET product details page. */
router.get('/product-details', function(req, res, next) {
  res.render('product-details');
});

router.get('/productsAPI', (req, res)=>{
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
