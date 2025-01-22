var express = require("express");
var router = express.Router();
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./db/skandiWall.db"); // Rätt filväg

// Slumpa och hämta 4 produkter från en lista
const getRandomProducts = (products, num = 4) => {
  const shuffled = products.sort(() => 0.5 - Math.random()); // Blanda produkterna
  return shuffled.slice(0, num); // Välj de första 4 produkterna
};

/* GET home page */
router.get("/", function (req, res, next) {
  db.all("SELECT * FROM Products", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }

    // Filtrera och slumpa produkter per kategori
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

    // Skicka de slumpmässiga produkterna till vyn
    res.render("index", {
      title: "SkandiWall",
      products: { nyheter, vinter, landskap, fritid }, // Skickar med alla kategorier
      category: "",
    });
  });
});

/* GET product details page. */
router.get("/product-details/:id", function (req, res, next) {
  const productId = req.params.id; // Hämta produktens id från URL
  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
    if (!row) {
      return res.status(404).send("Product not found");
    }
    // Skicka produktens detaljer till vyn
    res.render("product-details", { title: "Product Details", product: row });
  });
});

// GET för att filtrera produkter baserat på kategori
router.get("/:category", (req, res) => {
  const category = req.params.category; // Hämta kategorin från URL
  const sql = `SELECT * FROM products WHERE category = ?`; // SQL-fråga för att hämta produkter från en specifik kategori
  const params = [category];

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Slumpa och hämta 4 produkter per kategori
    const randomProducts = getRandomProducts(rows);

    res.render("index", {
      title: "SkandiWall",
      products: { [category]: randomProducts }, // Skickar med de slumpmässiga produkterna för vald kategori
      category: category,
    });
  });
});

module.exports = router;
