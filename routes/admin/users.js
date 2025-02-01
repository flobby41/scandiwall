const express = require('express');
const router = express.Router();
const db = require('../../db/db');

router.get('/', (req, res)=>{
  const sql = 'SELECT * FROM users';
  db.all(sql, [], (err, users) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.json(users); 
    }
  });
});

module.exports = router;