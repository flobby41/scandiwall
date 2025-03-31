var express = require("express");
var router = express.Router();
const db = require("../../db/db");
const Product = require("../../db/models/productModel"); // Import du modèle Product pour MongoDB

// Middleware principal pour la page d'accueil
router.get("/", async (req, res) => {
  console.log("Utilisateur connecté (req.user) :", req.user);

  try {
    const rows = await db.getAllProducts();
    res.render("index", {
      title: "SkandiWall",
      products: rows,
      firstname: req.user?.first_name || "gäst",
      lastname: req.user?.last_name || "",
      userId: req.user?._id || req.user?.id || null, // Gère à la fois les ID MongoDB et SQLite
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Database error");
  }
});

router.get("/products/:slug", async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  
  try {
    const product = await db.getProductBySlug(slug);
    
    if (product) {
      res.render("product-details", { product });
    } else {
      res.status(404).send("Produit introuvable");
    }
  } catch (err) {
    console.error("Erreur lors de la récupération du produit :", err);
    return res.status(500).send("Erreur de base de données.");
  }
});


/* GET all posters */
router.get("/product-list", async function (req, res) {
  try {
    const rows = await db.getAllProducts();
    // Rendera listan med alla produkter
    res.render("product-list", {
      title: "Alla posters",
      products: rows,
      userId: req.user?._id || req.user?.id || null,
      category: "Alla posters",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Database error");
  }
});

/* GET products by category */
router.get("/category/:category", async function (req, res) {
  const category = req.params.category;

  // Kontrollera om kategorin är giltig
  if (!category) {
    return res.status(400).send("Category is required");
  }

  try {
    const rows = await db.getProductsByCategory(category);
    // Rendera listan med produkter från vald kategori
    res.render("product-list", {
      title: `${category}`,
      products: rows,
      userId: req.user?._id || req.user?.id || null,
      category,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Database error");
  }
});

/* GET search results */
router.get("/search", async function (req, res) {
  const searchTerm = req.query.q;

  // Kontrollera om sökterm är tom
  if (!searchTerm) {
    return res.render("search", {
      title: "Sökresultat",
      products: [],
      query: "",
    });
  }

  try {
    let rows;
    if (db.useMongo) {
      // Utiliser MongoDB pour la recherche
      rows = await Product.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    } else {
      // Utiliser SQLite pour la recherche
      rows = await db.query(
        "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
        [`%${searchTerm}%`, `%${searchTerm}%`]
      );
    }

    // Rendera sökresultat
    res.render("search", {
      title: `Sökresultat för: ${searchTerm}`,
      products: rows,
      query: searchTerm, // Skicka med söktermen för att använda i vyn
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Database error");
  }
});

// Nouvelle route API pour récupérer des produits aléatoires
router.get("/api/random-products", async (req, res) => {
  try {
    const rows = await db.getAllProducts();
    
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
  } catch (err) {
    console.error(err);
    return res.status(500).send("Database error");
  }
});

// Fonction manquante dans le fichier (supposée comme exister)
function getRandomProducts(products, count = 3) {
  if (!products || products.length === 0) return [];
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, products.length));
}

module.exports = router;
