var express = require('express');
var router = express.Router();

var loggedIn = function (req, res, next) {
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

router.get('/signup', function(req, res, next) {
    res.render('signup');
});

router.get('/login', function(req, res, next) {
    res.render('login');
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});

router.get('/dashboard', loggedIn, function(req, res, next) {
    let user = req.session.passport.user;
    if(user) {
        if(user.role === 'user') {
            res.redirect('/dashboard/user');
        } else if(user.role === 'admin') {
            res.redirect('/dashboard/admin');
        }
    } else {
        res.send('failed logged in');
    }
});

router.get('/dashboard/user', function (req, res, next) {
    res.render('user-dashboard');
});

router.get('/dashboard/admin', function (req, res, next) {
    res.render('admin-dashboard');
});

router.get('/app', function(req, res, next) {
    res.sendFile('app.html', {root: __dirname + "/../public"});
});

router.get('/todolist', function(req, res, next) {
    res.sendFile('todolist.html', {root: __dirname + "/../public"});
});

module.exports = router;
