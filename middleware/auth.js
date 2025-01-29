const db = require('../db/db');

function checkAuthenticated(req, res, next) {
  if (req.user?.id) {
    console.log('Utilisateur connecté :', req.user);
    res.locals.firstname = req.user.first_name;
    res.locals.lastname = req.user.last_name;
    return next();
  }
  console.log('Utilisateur non connecté. Redirection vers /login.');
  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

module.exports = { checkAuthenticated, checkNotAuthenticated };