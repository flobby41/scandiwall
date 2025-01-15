var express = require('express');
var router = express.Router();
const db = require('../db/db');


/* GET product details page. */
router.get('/product-details', function(req, res, next) {
  res.render('product-details', { title: 'Product Details' });
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


module.exports = router;
