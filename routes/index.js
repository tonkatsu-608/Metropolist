const express = require('express');
const router = express.Router();
const User = require('../db/User');

let loggedIn = function (req, res, next) {
    if(req.isAuthenticated()) {
        next();
    }
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/failure', function(req, res, next) {
    res.status(500).json({ msg : 'Invalid email or password' });
});

router.put('/metro/api/v1/update', function (req, res) {
    let user = req.body;
    User.update(user, function (err, doc) {
        if (err) {
            res.status(500).send({msg: 'error occur in update'});
        } else {
            if(doc) {
                res.status(200).send({msg: 'update user successfully'});
            }
        }
    });
});

router.get('/app', function(req, res, next) {
    res.sendFile('app.html', {root: __dirname + "/../public"});
});

router.get('/todolist', function(req, res, next) {
    res.sendFile('todolist.html', {root: __dirname + "/../public"});
});

router.get('/api/users', function(req, res, next) {
    User.findAll( function(error, users) {
        if( error ) {
            res.status(500).json( error);
        } else {
            res.json( users.map(function (user) {
                return new User().transformUser(user);
            }));
        }
    });
});

router.get('/api/maps', function (req, res, next) {
    // let uid = req.params.uid;
});

// router.get('/logout', function (req, res) {
//     req.logout();
//     res.redirect('/login');
// });

module.exports = router;
