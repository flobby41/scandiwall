var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var sqlite3 = require("sqlite3").verbose(); // Importera sqlite3

// Importera routers
var indexRouter = require("./routes/user/products"); // Hanterar startsida och produkter
var usersRouter = require("./routes/user/users");
var cartRouter = require("./routes/user/cart");
var adminRouter = require("./routes/admin/admin");
var productsApiRouter = require("./routes/api/products");
var footerMenuRoutes = require("./routes/footerMenu"); // eller rätt sökväg


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
app.use("/cart", cartRouter);
app.use("/admin", adminRouter);
app.use("/api/products", productsApiRouter);

app.use('/', footerMenuRoutes);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
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
