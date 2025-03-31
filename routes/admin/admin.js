var express = require('express');
var router = express.Router();
const db = require('../../db/db');
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

router.post('/products/register', async function(req, res, next) {
  try {
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

    const productData = {
      name,
      description: description || null,
      image,
      stock_quantity: parseInt(stock_quantity),
      price: parseFloat(price),
      category: category || null,
      slugs: slug
    };

    await db.createProduct(productData);
    
    console.log(`Produkt registrerad med framgång`);
    res.redirect('/admin/');
  } catch (err) {
    console.error("Fel vid registrering av produkt:", err.message);
    return res.status(500).send("Internal Server Error.");
  }
});


router.post('/products/edit/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image, stock_quantity, price, category } = req.body;
    
    const slug = generateSlug(req.body.name);

    const productData = {
      name, 
      description, 
      image, 
      stock_quantity: parseInt(stock_quantity), 
      price: parseFloat(price), 
      category,
      slugs: slug
    };

    await db.updateProduct(id, productData);
    
    console.log(`Lyckades uppdatera produkt med ${id}.`);
    res.redirect('/admin/products');
  } catch (err) {
    console.error('Misslyckades att uppdatera produkten:', err.message);
    return res.status(500).send('Internal Server Error.');
  }
});

router.get('/products/edit/:id', async function (req, res, next) {
  try {
    const id = req.params.id;
    
    const product = await db.getProduct(id);
    
    if (!product) {
      return res.status(404).send("Produkten kunde inte hittas.");
    }
    
    res.render('admin/edit', { product });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;