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

/*=====================================================================================================
                                            User Api
======================================================================================================*/
router.get('/failure', function(req, res, next) {
    res.status(500).json({ msg : 'Invalid email or password' });
});

router.post('/metro/api/v1/logout', function (req, res) {
    req.logout();
});

router.get('/metro/api/v1/users', function(req, res, next) {
    User.findAll( function(err, users) {
        if( err ) {
            res.status(500).send( {msg: 'error occur in get users'} );
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
        if( err ) {
            res.status(500).send({msg: 'error occur in update user'});
        } else {
            if( doc ) {
                res.status(200).send({msg: 'update user successfully'});
            }
        }
    });
});

/*=====================================================================================================
                                            Map Api
======================================================================================================*/
router.get('/metro/api/v1/maps/:uid', function(req, res, next) {
    let uid = req.params.uid;
    Map.find()
        .where('uid').equals(uid)
        .sort({ editDate: -1 })
        .exec(function(err, users) {
            if( err ) {
                res.status(500).send({ msg: 'error occur in finding maps for specific user'});
            } else {
                res.json( users.map(function (map) {
                    return new Map().transformMap(map);
                }));
            }
        });
});

router.post('/metro/api/v1/map/save', function (req, res, next) {
    let map = req.body;
    Map.findByName(map.name, function (err, doc) {
        if( err ) {
            res.status(500).send({msg: 'error occur in finding map'});
        } else {
            if( doc ) {
                res.status(500).send({ error: map.name + ' already exists' });
            }else{
                let tempMap = new Map();
                tempMap.uid = map.uid;
                tempMap.img = map.img;
                tempMap.name = map.name;
                tempMap.sites = map.sites;
                tempMap.clusters = map.clusters;
                tempMap.createDate = map.createDate;
                tempMap.editDate = map.editDate;
                tempMap.save(function (err) {
                    if( err ) {
                        res.status(500).send({ error : 'error: no map name' });
                    }else{
                        res.status(200).send({ msg : 'create map successfully' });
                    }
                });
            }
        }
    });
});

router.put('/metro/api/v1/map/update', function (req, res, next) {
    let map = req.body;
    Map.update(map, function (err, doc) {
        if(err) {
            res.status(500).send({msg: 'error occur in update map'});
        } else {
            if(doc) {
                res.status(200).send({msg: 'update map successfully'});
            }
        }
    });
});

router.delete('/metro/api/v1/map/delete/:id', function (req, res, next) {
    let id = req.params.id;
    Map.delete(id, function (err, doc) {
        if(err) {
            res.status(500).send({msg: 'error occur in delete map'});
        } else {
            if(doc) {
                res.status(200).send({msg: 'delete map successfully'});
            }
        }
    })
});

router.get('/app', function(req, res, next) {
    res.sendFile('app.html', {root: __dirname + "/../public"});
});

router.get('/todolist', function(req, res, next) {
    res.sendFile('todolist.html', {root: __dirname + "/../public"});
});

module.exports = router;
