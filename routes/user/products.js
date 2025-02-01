var express = require('express');
var router = express.Router();
const db = require('../../db/db');

// Middleware principal pour la page d'accueil
router.get('/', (req, res) => {
  console.log('Utilisateur connecté (req.user) :', req.user);

  let queries = [
    { category: "Nyheter", key: "nyheter" },
    { category: "Vinter", key: "vinter" },
    { category: "Landskap", key: "landskap" },
    { category: "Fritid", key: "fritid" }
  ];

  let productData = {};

  let pendingQueries = queries.length;

  queries.forEach(({ category, key }) => {
    db.all(
      `SELECT * FROM products WHERE category = ? ORDER BY RANDOM() LIMIT 4`,
      [category],
      (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Database error");
        }
        
        productData[key] = rows;

        pendingQueries--;

        if (pendingQueries === 0) {
          res.render('index', {
            title: 'SkandiWall',
            products: productData,
            firstname: req.user?.first_name || 'gäst',
            lastname: req.user?.last_name || '',
            userId: req.user?.id || null
          });
        }
      }
    );
  });
});
router.get('/products/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const mainProductSql = 'SELECT id, name, price, image, slugs FROM products WHERE slugs = ?';

  db.get(mainProductSql, [slug], (err, product) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err);
      return res.status(500).send('Erreur de base de données.');
    }

    if (product) {
      res.render('product-details', { product });
    } else {
      res.status(404).send('Produit introuvable');
    }
  });
});



/* GET all posters */
router.get("/product-list", function (req, res) {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }

    // Rendera listan med alla produkter
    res.render("product-list", {
      title: "Alla posters",
      products: rows,
      category: "Alla posters",
    });
  });
});

/* GET products by category */
router.get("/category/:category", function (req, res) {
  const category = req.params.category;

  // Kontrollera om kategorin är giltig
  if (!category) {
    return res.status(400).send("Category is required");
  }

  db.all(
    "SELECT * FROM products WHERE category = ?",
    [category],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }

      // Rendera listan med produkter från vald kategori
      res.render("product-list", {
        title: `${category}`,
        products: rows,
        category,
      });
    }
  );
});

/* GET search results */
router.get("/search", function (req, res) {
  const searchTerm = req.query.q;

  // Kontrollera om sökterm är tom
  if (!searchTerm) {
    return res.render("search", {
      title: "Sökresultat",
      products: [],
      query: "",
    });
  }

  db.all(
    "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
    [`%${searchTerm}%`, `%${searchTerm}%`],
    function (err, rows) {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }

      // Rendera sökresultat
      res.render("search", {
        title: `Sökresultat för: ${searchTerm}`,
        products: rows,
        query: searchTerm, // Skicka med söktermen för att använda i vyn
      });
    }
  );
});



module.exports = router;