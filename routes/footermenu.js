const express = require('express');
const router = express.Router();

router.get('/vi-hjalper-dig', (req, res) => {
    res.render('footermenu/vi-hjalper-dig', { title: 'Vi hjälper dig' });
});

router.get('/kontakta-oss', (req, res) => {
    res.render('footermenu/kontakta-oss', { title: 'Kontakta oss' });
});

router.get('/returpolicy', (req, res) => {
    res.render('footermenu/returpolicy', { title: 'Returpolicy' });
});

router.get('/fraktalternativ', (req, res) => {
    res.render('footermenu/fraktalternativ', { title: 'Fraktalternativ' });
});

router.get('/vanliga-fragor', (req, res) => {
    res.render('footermenu/vanliga-fragor', { title: 'Vanliga frågor' });
});

router.get('/om-oss', (req, res) => {
    res.render('footermenu/om-oss', { title: 'Om oss' });
});


router.get('/samarbeten', (req, res) => {
    res.render('footermenu/samarbeten', { title: 'Samarbeten' });
});
module.exports = router;
