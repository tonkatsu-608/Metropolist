var express = require('express');
var router = express.Router();
var User = require('../db/User');

module.exports = function (passport) {
    router.post('/signup', function(req, res) {
        let body = req.body,
            username = body.username,
            password = body.password;
        User.findOne({username: username}, function (err, doc) {
            if (err) {
                res.status(500).send('error occur');
            } else {
                if (doc) {
                    res.status(500).send('Username already exists');
                }else{
                    let tempUser = new User();
                    tempUser.username = username;
                    tempUser.password = tempUser.hashPassword(password);
                    tempUser.save(function (err, user) {
                        if(err) {
                            res.status(500).send('db error');
                        }else{
                            res.send(user);
                        }
                    });
                }
            }
        });
    });

    router.post('/login', passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/login'
    }), function (req, res) {
        res.send('hello world');
    });

    return router;
};
