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
                                            User API
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

router.put('/metro/api/v1/u/update', function (req, res) {
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
                                            Map API
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
                res.status(200).json( users.map(function (map) {
                    return new Map().transformMap(map);
                }));
            }
        });
});

router.get('/metro/api/v1/m/:id', function(req, res, next) {
    let id = req.params.id;
    Map.findOne({_id: id}, function (err, map) {
        if( err ) {
            res.status(404).send({ error: 'no such map' });
        } else {
            res.status(200).send(new Map().transformMap(map));
        }
    });
});

router.post('/metro/api/v1/m/create', function (req, res, next) {
    let map = req.body;
    let tempMap = new Map();
    tempMap.uid = map.uid;
    tempMap.img = map.img;
    tempMap.name = map.name;
    tempMap.createDate = map.createDate;
    tempMap.editDate = map.editDate;
    tempMap.save(function (err, doc) {
        if( err ) {
            res.status(500).send({ error : 'error occur in creating map' });
        } else {
            res.status(200).send(doc._id);
        }
    });
});

router.put('/metro/api/v1/m/update', function (req, res, next) {
    let map = req.body;
    Map.update(map, function (err, doc) {
        if(err) {
            res.status(404).send({msg: 'error: map did not find'});
        } else {
            if(doc) {
                res.status(200).send({msg: 'update map successfully'});
            }
        }
    });
});

router.delete('/metro/api/v1/m/delete/:id', function (req, res, next) {
    let id = req.params.id;
    Map.delete(id, function (err, doc) {
        if(err) {
            res.status(404).send({msg: 'map did not find'});
        } else {
            if(doc) {
                res.status(204).send({msg: 'delete map successfully'});
            }
        }
    })
});

router.put('/metro/api/v1/u/update/email', function (req, res, next) {
    let user = req.body;
    User.findByEmail(user.email, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'error occur in finding user'});
        } else {
            if (doc) {
                res.status(500).send({msg: 'Email already exists'});
            }else{
                User.updateEmail(user, function (err, user) {
                    if(err) {
                        res.status(404).send({msg: 'error: user did not find'});
                    } else {
                        if(user) {
                            res.status(200).json(new User().transformUser(user));
                        }
                    }
                });
            }
        }
    });
});

router.put('/metro/api/v1/u/update/name', function (req, res, next) {
    let user = req.body;
    User.updateName(user, function (err, user) {
        if(err) {
            res.status(404).send({msg: 'error: user did not find'});
        } else {
            if(user) {
                res.status(200).json(new User().transformUser(user));
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

module.exports = router;
