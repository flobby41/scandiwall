var express = require('express');
var router = express.Router();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/skandiWall.db');

/* GET /admin */
router.get('/', function(req, res, next) {
    res.render('admin/index', { title: 'Administration' });
  });

/* GET /admin/products */
router.get('/products', function (req, res, next) {
  res.render('admin/products', { title: 'Produkter' });
});

/* GET admin/products/register */
router.get('/products/register', function(req, res, next) {
    res.render('admin/register', { title: 'Registrera ny produkt' });
  });


/* POST admin/products/register */
router.post('/products/register', function(req, res, next) {
  const {
    name,
    description,
    image,
    stock_quantity,
    price,
    category,
  } = req.body;

  if (!name || !image || !stock_quantity || !price) {
    return res.status(400).send("Vänligen fyll i de obligatoriska fälten.");
  }

  const sql = `
      INSERT INTO products (name, description, image, stock_quantity, price, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `;
  const values = [
      name,
      description || null,
      image,
      parseInt(stock_quantity),
      parseFloat(price),
      category || null,
  ];

  db.run(sql, values, function (err) {
      if (err) {
          console.error("Fel vid registrering av produkt:", err.message);
          return res.status(500).send("Internal Server Error.");
      }

      console.log(`Produkt registrerad med ID: ${this.lastID}`);
      res.redirect('/admin/');
  });
});

module.exports = router;
