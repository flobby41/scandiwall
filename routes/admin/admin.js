var express = require('express');
var router = express.Router();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/skandiWall.db');
const generateSlug = require('../../db/utilities/generate-slug');

router.get('/', function(req, res, next) {
    res.render('admin/index', { title: 'Administration' });
  });

router.get('/products/', function(req, res, next) {
  res.render('admin/index', { title: 'Administration' });
});


router.get('/products/register', function(req, res, next) {
  res.render('admin/register', { title: 'Registrera ny produkt' });
});

router.post('/products/register', function(req, res, next) {
  const slug = generateSlug(req.body.name);

  const {
    name,
    description,
    image,
    stock_quantity,
    price,
    category,
  } = req.body;

  if (!name ||!image ||!stock_quantity ||!price) {
    return res.status(400).send("Vänligen fyll i de obligatoriska fälten.");
  }

  const sql = `
      INSERT INTO products (
        name,
        description,
        image,
        stock_quantity,
        price,
        category,
        slugs,
        created_at
      )
      VALUES (?,?,?,?,?,?,?, datetime('now'))
  `;

  const values = [
    name,
    description || null,
    image,
    parseInt(stock_quantity),
    parseFloat(price),
    category || null,
    slug
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


router.post('/products/edit/:id', (req, res, next) => {
  const { id } = req.params;
  const { name, description, image, stock_quantity, price, category } = req.body;
  
  const slug = generateSlug(req.body.name);

  const sql = `
    UPDATE products
    SET 
      name = ?, 
      description = ?, 
      image = ?, 
      stock_quantity = ?, 
      price = ?, 
      category = ?, 
      slugs = ?
    WHERE id = ?
  `;

  const values = [name, description, image, stock_quantity, price, category, slug, id];

  db.run(sql, values, function (err) {
    if (err) {
      console.error('Misslyckades att uppdatera produkten:', err.message);
      return res.status(500).send('Internal Server Error.');
    }

    console.log(`Lyckades uppdatera produkt med ${id}.`);
    res.redirect('/admin/products');
  });
});

router.get('/products/edit/:id', function (req, res, next) {
  const id = req.params.id;
  
  db.get("SELECT * FROM products WHERE id = ?", id, (err, row) => {
    if (err) return next(err);
    
    if (!row) {
      return res.status(404).send("Produkten kunde inte hittas.");
    }
    res.render('admin/edit', { product: row });
  });
});


module.exports = router;