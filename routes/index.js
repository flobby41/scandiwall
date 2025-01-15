var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./db/skandiWall.db'); // Ändra här till rätt filväg

/* GET home page. */
router.get('/', function(req, res, next) {
  db.all('SELECT * FROM Products', (err, rows) => {  // Hämtar alla produkter från databasen
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    // Skickar produkterna till vyn
    res.render('index', { title: 'SkandiWall', products: rows });
  });
});



module.exports = router;
