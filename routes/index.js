var express = require('express');
var router = express.Router();

var loggedin = function (req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/login', function(req, res, next) {
    res.render('login');
});

router.get('/signup', function(req, res, next) {
    res.render('signup');
});

router.get('/dashboard', loggedin, function(req, res, next) {
    res.send(req.session);
});

router.get('/logout', function (req, res) {
    req.logout();
    res.send('/');
})

router.get('/app', function(req, res, next) {
    res.sendFile('app.html', {root: __dirname + "/../public"});
});


module.exports = router;
