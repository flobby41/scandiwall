var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
var bodyParser = require('body-parser');
var initializePassport = require('./passport-config'); // Assurez-vous d'avoir ce fichier ou de le créer
var db = require('./db/db'); // Base de données
var app = express();

var productsRouter = require('./routes/user/products');
var cartRouter = require('./routes/user/cart');
var adminRouter = require('./routes/admin/admin');
var productsApiRouter = require('./routes/api/products');
var userRouter = require('./routes/user/profile');
var adminUsers = require('./routes/admin/users');
var userOrder = require('./routes/user/orders');
var footerMenuRoutes = require("./routes/footermenu"); // Correction de la casse (footermenu au lieu de footerMenu)


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Sessions
app.use(
  session({
    secret: 'votre_secret', // Remplacez par une clé sécurisée
    resave: false, // N'enregistrez pas la session si elle n'a pas été modifiée
    saveUninitialized: false, // N'enregistrez pas les sessions vides
    rolling: true, // Prolonge la durée de vie du cookie à chaque requête
    cookie: {
      httpOnly: true, // Empêche l'accès JavaScript aux cookies
      secure: false, // Passez à true si vous utilisez HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // Durée de vie du cookie : 7 jours
    },
  })
);

// Log des sessions pour débogage
app.use((req, res, next) => {
  console.log('Session actuelle :', req.session);
  next();
});
//middleware pour vérifier si la session est toujours active.
app.use((req, res, next) => {
  if (!req.session) {
    console.log('Session expirée ou introuvable.');
    return res.redirect('/profile/login');
  }
  next();
});

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware global pour injecter l'utilisateur dans les vues
app.use((req, res, next) => {
  res.locals.user = req.user || null; // Ajoute req.user aux variables locales
  console.log('Utilisateur connecté (req.user) :', req.user);
  next();
});

// Middleware pour enregistrer des logs supplémentaires
app.use((req, res, next) => {
  console.log('Est authentifié ?', req.isAuthenticated ? req.isAuthenticated() : 'Non défini');
  next();
});

app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/profile', userRouter);
app.use('/', productsRouter);
app.use('/', cartRouter);
app.use('/admin', adminRouter);
app.use('/api', productsApiRouter);
app.use('/admin/users', adminUsers);
app.use('/', userOrder);
app.use('/', footerMenuRoutes);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Initialisation de Passport
initializePassport(
  passport,
  async (email) => {
    try {
      return await db.getUserByEmail(email);
    } catch (err) {
      console.error('Erreur lors de la recherche par email:', err);
      return null;
    }
  },
  async (id) => {
    try {
      return await db.getUser(id);
    } catch (err) {
      console.error('Erreur lors de la recherche par ID:', err);
      return null;
    }
  }
);

module.exports = app; // Important : exporte l'instance d'Express