const express = require('express');
const router = express.Router();
const Map = require('../db/Map');
const User = require('../db/User');
const paginate = require('express-paginate');

let loggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        return res.status(401).json({
            error: 'User not authenticated'
        })
    }
}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

/*=====================================================================================================
                                            User API
======================================================================================================*/
router.get('/failure', function (req, res, next) {
    res.status(500).json({msg: 'invalid email or password', status: 'invalid'});
});

router.post('/metro/api/v1/logout', function (req, res) {
    req.logout();
});

// get user by id
router.get('/metro/api/v1/user/:id', function (req, res, next) {
    let id = req.params.id;
    User.findOne({_id: id}, function (err, user) {
        if (err) {
            res.status(404).send({error: 'no such user'});
        } else {
            res.status(200).send(new User().transformUser(user));
        }
    });
});

router.get('/metro/api/v1/users', function (req, res, next) {
    User.findAll(function (err, users) {
        if (err) {
            res.status(500).send({msg: 'error occur in get users'});
        } else {
            res.json(users.map(function (user) {
                return new User().transformUser(user);
            }));
        }
    });
});

router.patch('/metro/api/v1/user/verify/password', function (req, res, next) {
    let body = req.body;
    User.findOne({_id: body.id}, function (err, user) {
        if (err) {
            res.status(404).send({error: 'no such user'});
        } else {
            res.status(200).send(new User().verifyPassword(body.password, user.password));
        }
    });
});

router.put('/metro/api/v1/user/update/email', function (req, res, next) {
    let user = req.body;
    User.findByEmail(user.email, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'error occur in finding user'});
        } else {
            if (doc) {
                res.status(409).send({msg: 'sorry, email already exists'});
            } else {
                User.updateEmail(user, function (err, doc) {
                    if (err) {
                        res.status(404).send({msg: 'error: user did not find'});
                    } else {
                        if (doc) {
                            res.status(200).json(new User().transformUser(doc));
                        }
                    }
                });
            }
        }
    });
});

router.put('/metro/api/v1/user/update/name', function (req, res, next) {
    let user = req.body;
    User.updateName(user, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'error: user did not find'});
        } else {
            if (doc) {
                res.status(200).json(new User().transformUser(doc));
            }
        }
    });
});

router.put('/metro/api/v1/user/update/password', function (req, res, next) {
    let user = req.body;
    user.password = new User().hashPassword(user.password);
    User.updatePassword(user, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'error: user did not find'});
        } else {
            if (doc) {
                res.status(200).json(new User().transformUser(doc));
            }
        }
    });
});

router.put('/metro/api/v1/user/update/enabled', function (req, res, next) {
    let user = req.body;
    User.updateEnabled(user, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'error: user did not find'});
        } else {
            if (doc) {
                res.status(200).json(new User().transformUser(doc));
            }
        }
    });
});
/*=====================================================================================================
                                            Map API
======================================================================================================*/
// get all visible maps
router.get('/metro/api/v1/maps', async (req, res, next) => {
    try {
        const [results, itemCount] = await Promise.all([
            Map.find({isVisible: true})
                .sort({createDate: -1})
                // .limit(req.query.limit)
                .exec(),
            Map.count({isVisible: true})
        ]);

        const pageCount = Math.ceil(itemCount / req.query.limit); // how many pages
        let currentPage = parseInt(req.query.page);
        if (!currentPage) currentPage = 1;
        if (currentPage > pageCount) currentPage = pageCount;

        res.send({
            maps: results.map(m => new Map().transformMap(m)).slice(currentPage * req.query.limit - req.query.limit, currentPage * req.query.limit),
            currentPage: currentPage,
            pageCount: pageCount,
            mapCount: itemCount
        });

    } catch (err) {
        next(err);
    }
});

// get map by id
router.get('/metro/api/v1/map/:id', function (req, res, next) {
    let id = req.params.id;
    Map.findOne({_id: id}, function (err, map) {
        if (err) {
            res.status(404).send({error: 'no such map'});
        } else {
            res.status(200).send(new Map().transformMap(map));
        }
    });
});

// get all maps belong to the user
router.get('/metro/api/v1/user/:uid/maps/', function (req, res, next) {
    let uid = req.params.uid;
    Map.find()
        .where('uid').equals(uid)
        .sort({editDate: -1})
        .exec(function (err, users) {
            if (err) {
                res.status(500).send({msg: 'error occur in finding maps for specific user'});
            } else {
                res.status(200).json(users.map(m => new Map().transformMap(m)));
            }
        });
});

// create map with id
router.post('/metro/api/v1/map/create', function (req, res, next) {
    let map = req.body;
    let tempMap = new Map();
    tempMap.uid = map.uid || "";
    tempMap.img = map.img || "";
    tempMap.name = map.name || "";
    tempMap.createDate = map.createDate;
    tempMap.editDate = map.editDate;
    tempMap.isVisible = map.isVisible || false;

    tempMap.save(function (err, doc) {
        if (err) {
            res.status(500).send({error: 'error occur in creating map'});
        } else {
            res.status(200).send(doc._id);
        }
    });
});

// update map
router.put('/metro/api/v1/map/update', function (req, res, next) {
    let map = req.body;
    Map.update(map, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'error: map did not find'});
        } else {
            if (doc) {
                res.status(200).send({msg: 'update map successfully'});
            }
        }
    });
});

router.delete('/metro/api/v1/map/delete/:id', function (req, res, next) {
    let id = req.params.id;
    Map.delete(id, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'map did not find'});
        } else {
            if (doc) {
                res.status(204).send({msg: 'delete map successfully'});
            }
        }
    })
});

router.get('/app', function (req, res, next) {
    res.sendFile('app.html', {root: __dirname + "/../public"});
});

router.get('/todolist', function (req, res, next) {
    res.sendFile('todolist.html', {root: __dirname + "/../public"});
});

router.get('/elevation-demo', function (req, res, next) {
    res.sendFile('elevation-demo.html', {root: __dirname + "/../public"});
});

router.get('/topology', function (req, res, next) {
    res.sendFile('topology-demo.html', {root: __dirname + "/../public"});
});

router.get('/split-poly', function (req, res, next) {
    res.sendFile('split-poly.html', {root: __dirname + "/../public"});
});

module.exports = router;