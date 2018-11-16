var express = require('express');
var router = express.Router();
var User = require('../db/User');

module.exports = function (passport) {
    router.post('/signup', function(req, res) {
        let body = req.body,
            email = body.email,
            firstname = body.firstname,
            lastname = body.lastname,
            password = body.password;
        User.findByEmail(email, function (err, doc) {
            if (err) {
                res.status(500).send('error occur');
            } else {
                if (doc) {
                    res.status(500).send('Email already exists');
                }else{
                    let tempUser = new User();
                    tempUser.email = email;
                    tempUser.firstname = firstname;
                    tempUser.lastname = lastname;
                    tempUser.password = tempUser.hashPassword(password);
                    tempUser.role = "user";
                    tempUser.enabled = true;
                    tempUser.save(function (err, user) {
                        if(err) {
                            res.status(500).send('db error');
                        }else{
                            delete user.password;
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
        res.send('no authentication');
    });

    return router;
};
