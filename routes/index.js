const express = require('express');
const router = express.Router();
const Map = require('../db/Map');
const User = require('../db/User');

let loggedIn = function (req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        return res.status(401).json({
            error: 'User not authenticated'
        })
    }
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/failure', function(req, res, next) {
    res.status(500).json({ msg : 'Invalid email or password' });
});

router.post('/metro/api/v1/logout', function (req, res) {
    req.logout();
});

router.get('/metro/api/v1/users', function(req, res, next) {
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

router.put('/metro/api/v1/user/update', function (req, res) {
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

router.post('/metro/api/v1/map/create', function (req, res, next) {
    let map = req.body;
    console.log(map);
    console.log(req.user);
    let tempMap = new Map();
    tempMap.uid = map.uid;
    tempMap.name = map.name;
    tempMap.img = map.img;
    tempMap.data = map.data;
    tempMap.save(function (err, map) {
        if(err) {
            res.status(500).send({ error : 'db error' });
        }else{
            res.status(200).json({ msg : 'create map successfully' });
        }
    });
});

router.get('/app', function(req, res, next) {
    res.sendFile('app.html', {root: __dirname + "/../public"});
});

router.get('/todolist', function(req, res, next) {
    res.sendFile('todolist.html', {root: __dirname + "/../public"});
});

module.exports = router;
