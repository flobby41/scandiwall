var express = require("express");
var router = express.Router();
const db = require("../../db/db");

// Middleware principal pour la page d'accueil
router.get("/", (req, res) => {
  console.log("Utilisateur connecté (req.user) :", req.user);

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

    res.render("index", {
      title: "SkandiWall",
      products: rows,
      products: { nyheter, vinter, landskap, fritid },
      firstname: req.user?.first_name || "gäst",
      lastname: req.user?.last_name || "",
      userId: req.user?.id || null, // Si req.user est undefined, userId sera null
    });
  });
});
router.get("/products/:slug", (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const mainProductSql =
    "SELECT id, name, price, image, slugs, description FROM products WHERE slugs = ?";

  db.get(mainProductSql, [slug], (err, product) => {
    if (err) {
      console.error("Erreur lors de la récupération du produit :", err);
      return res.status(500).send("Erreur de base de données.");
    }

    if (product) {
      res.render("product-details", { product });
    } else {
      res.status(404).send("Produit introuvable");
    }
  });
});

// Funktion för att slumpa och hämta ett antal produkter från en lista
const getRandomProducts = (products, num = 4) => {
  const shuffled = products.sort(() => 0.5 - Math.random()); // Blanda produkterna
  return shuffled.slice(0, num); // Välj det angivna antalet produkter
};

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

// Nouvelle route API pour récupérer des produits aléatoires
router.get("/api/random-products", (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }

    res.json({
      nyheter: getRandomProducts(
        rows.filter((product) => product.category === "Nyheter")
      ),
      vinter: getRandomProducts(
        rows.filter((product) => product.category === "Vinter")
      ),
      landskap: getRandomProducts(
        rows.filter((product) => product.category === "Landskap")
      ),
      fritid: getRandomProducts(
        rows.filter((product) => product.category === "Fritid")
      ),
    });
  });
});

module.exports = router;
