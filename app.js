var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var sqlite3 = require("sqlite3").verbose(); // Importera sqlite3

// Importera routers
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var productsRouter = require("./routes/user/products");
var cartRouter = require("./routes/user/cart");
var adminRouter = require("./routes/admin/admin");
var productsApiRouter = require("./routes/api/products");

var app = express();

// Setup för sqlite3
var db = new sqlite3.Database("./db/skandiWall.db"); // Anslut till din databas

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/", productsRouter);
app.use("/", cartRouter);
app.use("/admin", adminRouter);
app.use("/api/products", productsApiRouter);

// Hantera sökförfrågningar
app.get("/search", function (req, res, next) {
  var query = req.query.q; // Hämtar sökfrågan från URL

  if (query) {
    // Söka i databasen efter produkter som matchar sökordet
    var sql = "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?";
    db.all(sql, [`%${query}%`, `%${query}%`], (err, rows) => {
      if (err) {
        next(err); // Skicka vidare eventuella fel
      } else {
        // Rendera resultatet i search.ejs
        res.render("search", { query, products: rows });
      }
    });
  } else {
    // Om inget sökord finns, visa en tom sida eller ett meddelande
    res.render("search", { query, products: [] });
  }
});

// Catch 404 och vidarebefordra till error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
