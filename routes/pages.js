const express = require('express');
const authController = require('../controllers/auth')
const router = express.Router();


router.get('/', authController.isLoggedIn, (req, res) => {
res.render('index', {
    user: req.user //Ger en personlig sida - Namn/Email på sidan kommer ändras beroende på inlogg
});
});

router.get('/register', (req, res) => {
    res.render('register');
    });

router.get('/login', (req, res) => {
        res.render('login');
        });

router.get('/profile', authController.isLoggedIn, (req, res) => { /* Middleware -
Alltså när man går till /profile kommer authController.isLoggedIn köras */

    if(req.user) { // req står för request inte require
    res.render('profile', {
        user: req.user //Ger en personlig sida - Namn/Email på sidan kommer ändras beroende på inlogg
    });
    } else {
      res.redirect('/login') /* Om en token/cookie inte finns kan användaren inte
      gå in på profile sidan utan skickas till /login istället */
    }
})


    module.exports = router;
