// /*================================================================================
//                                      User API
// ================================================================================*/
// router.get('/metro/api/v1/users/:uid', (req, res, next) => {...});
// router.get('/metro/api/v1/users', (req, res, next) => {...});
// router.patch('/metro/api/v1/users/:uid/password', (req, res, next) => {...});
// router.put('/metro/api/v1/users/:uid/email', (req, res, next) => {...});
// router.put('/metro/api/v1/users/:uid/name', (req, res, next) => {...});
// router.put('/metro/api/v1/users/:uid/password', (req, res, next) => {...});
// router.put('/metro/api/v1/users/:uid/enabled', (req, res, next) => {...});
//
// /*================================================================================
//                                		Map API
// ================================================================================*/
// router.get('/metro/api/v1/maps', async (req, res, next) => {...});
// router.get('/metro/api/v1/maps/:mid', (req, res, next) => {...});
// router.get('/metro/api/v1/users/:uid/maps/', (req, res, next) => {...});
// router.post('/metro/api/v1/maps', (req, res, next) => {...});
// router.put('/metro/api/v1/maps/:mid', (req, res, next) => {...});
// router.delete('/metro/api/v1/maps/:mid', (req, res, next) => {...});

const express = require('express');
const router = express.Router();
const passport = require('passport');

const Map = require('../db/Map');
const User = require('../db/User');

let loggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        return res.status(401).send({msg: 'error: user not authenticated'});
    }
}

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

/*=====================================================================================================
                                            User API
======================================================================================================*/

router.get('/failure', (req, res) => {
    res.status(500).json({msg: 'invalid email or password', status: 'invalid'});
});

// get user by uid
router.get('/metro/api/v1/users/:uid', passport.authenticate('jwt'), (req, res) => {
    let uid = req.params.uid;
    User.findOne({_id: uid}, function (err, user) {
        if (err) {
            res.status(404).send({msg: 'error: user did not find'});
        } else {
            res.status(200).send(new User().transformUser(user));
        }
    });
});

router.get('/metro/api/v1/users', passport.authenticate('jwt'), (req, res) => {
    User.findAll(function (err, users) {
        if (err) {
            res.status(404).send({msg: 'error: cannot find users'});
        } else {
            res.json(users.map(function (user) {
                return new User().transformUser(user);
            }));
        }
    });
});

router.patch('/metro/api/v1/users/:uid/password', passport.authenticate('jwt'), (req, res) => {
    let uid = req.params.uid;
    let body = req.body;
    User.findOne({_id: uid}, function (err, user) {
        if (err) {
            res.status(404).send({msg: 'error: user did not find'});
        } else {
            res.status(200).send(new User().verifyPassword(body.password, user.password));
        }
    });
});

router.put('/metro/api/v1/users/:uid/email', passport.authenticate('jwt'), (req, res) => {
    let uid = req.params.uid;
    let user = req.body;
    User.findByEmail(user.email, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'error: user did not find'});
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

router.put('/metro/api/v1/users/:uid/name', passport.authenticate('jwt'), (req, res) => {
    let uid = req.params.uid;
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

router.put('/metro/api/v1/users/:uid/password', passport.authenticate('jwt'), (req, res) => {
    let uid = req.params.uid;
    let user = req.body;
    user.password = new User().hashPassword(user.password);
    User.updatePassword(user, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'error: user did not find'});
        } else {
            if (doc) {
                res.status(200).json({msg: 'password updated successfully'});
            }
        }
    });
});

router.put('/metro/api/v1/users/:uid/enabled', passport.authenticate('jwt'), (req, res) => {
    let uid = req.params.uid;
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
router.get('/metro/api/v1/maps', passport.authenticate('jwt'), async (req, res, next) => {
    let currentPage = parseInt(req.query.page);
    let limit = parseInt(req.query.limit) || 3;

    try {
        const [results, itemCount] = await Promise.all([
            Map.find({isVisible: true})
                .sort({createDate: -1})
                .limit(currentPage * limit)
                .exec(),
            Map.count({isVisible: true})
        ]);

        const pageCount = Math.ceil(itemCount / limit); // how many pages
        if (!currentPage) currentPage = 1;
        if (currentPage > pageCount) currentPage = pageCount;

        const from = (currentPage - 1) * limit;
        let to = currentPage * limit;
        if (to < 0) to = 0;

        res.send({
            maps: results.map(m => new Map().transformMap(m)).slice(from, to),
            currentPage: currentPage,
            pageCount: pageCount,
            mapCount: itemCount
        });
    } catch (err) {
        next(err);
    }
});

// get map by id
router.get('/metro/api/v1/maps/:mid', passport.authenticate('jwt'), (req, res) => {
    let mid = req.params.mid;
    // Map.find()
    //     .where('_id').equals(mid)
    //     .exec(function (err, map) {
    //         if (err) {
    //             res.status(404).send({msg: 'error: cannot find the map'});
    //         } else {
    //             res.status(200).send(new Map().transformMap(map));
    //         }
    //     });
    Map.findOne({_id: mid}, function (err, map) {
        if (err) {
            res.status(404).send({msg: 'error: cannot find the map'});
        } else {
            res.status(200).send(new Map().transformMap(map));
        }
    });
});

// get all maps belong to the user
router.get('/metro/api/v1/users/:uid/maps/', passport.authenticate('jwt'), (req, res) => {
    let uid = req.params.uid;
    Map.find()
        .where('uid').equals(uid)
        .sort({editDate: -1})
        .exec(function (err, users) {
            if (err) {
                res.status(404).send({msg: 'error: cannot find maps'});
            } else {
                res.status(200).json(users.map(m => new Map().transformMap(m)));
            }
        });
});

// create map with mid
router.post('/metro/api/v1/maps', passport.authenticate('jwt'), (req, res) => {
    let map = req.body;
    let tempMap = new Map();
    tempMap.uid = map.uid || "";
    tempMap.img = map.img || "";
    tempMap.name = map.name || "";
    tempMap.createDate = map.createDate || formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss', 'en-US');
    tempMap.editDate = map.editDate;
    tempMap.isVisible = map.isVisible || false;

    tempMap.save(function (err, doc) {
        if (err) {
            res.status(400).send({error: 'error occur in creating the map'});
        } else {
            res.status(201).send(doc._id);
        }
    });
});

// update map
router.put('/metro/api/v1/maps/:mid', passport.authenticate('jwt'), (req, res) => {
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

router.delete('/metro/api/v1/maps/:mid', passport.authenticate('jwt'), (req, res) => {
    let mid = req.params.mid;
    Map.delete(mid, function (err, doc) {
        if (err) {
            res.status(404).send({msg: 'map did not find'});
        } else {
            if (doc) {
                res.status(204).send({msg: 'delete map successfully'});
            }
        }
    })
});

/*=====================================================================================================
                                            File API
======================================================================================================*/

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