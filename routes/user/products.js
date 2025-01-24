var express = require("express");
var router = express.Router();
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./db/skandiWall.db"); // Rätt filväg

// Funktion för att slumpa och hämta ett antal produkter från en lista
const getRandomProducts = (products, num = 4) => {
  const shuffled = products.sort(() => 0.5 - Math.random()); // Blanda produkterna
  return shuffled.slice(0, num); // Välj det angivna antalet produkter
};

/* GET home page */
router.get("/", function (req, res) {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }

    // Filtrera produkter baserat på kategorier
    const nyheter = getRandomProducts(
      rows.filter((product) => product.category === "Nyheter")
    );
    const vinter = getRandomProducts(
      rows.filter((product) => product.category === "Vinter")
    );
    const landskap = getRandomProducts(
      rows.filter((product) => product.category === "Landskap")
    );
    const fritid = getRandomProducts(
      rows.filter((product) => product.category === "Fritid")
    );

    // Rendera startsidan med kategoriserade produkter
    res.render("index", {
      title: "SkandiWall",
      products: { nyheter, vinter, landskap, fritid },
    });
  });
});

/* GET product details page */
router.get("/product-details/:id", function (req, res) {
  const productId = req.params.id;

  // Kontrollera om id är giltigt
  if (!productId) {
    return res.status(400).send("Product ID is required");
  }

  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
    if (!row) {
      return res.status(404).send("Product not found");
    }

    // Rendera produktsidan
    res.render("product-details", {
      title: "Product Details",
      product: row,
    });
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
// Definiera dina footer-rutter här
router.get("/", function (req, res) {
  res.send("Footer menu");
});
module.exports = router;
