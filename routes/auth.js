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
                res.status(500).send({msg: 'error occur in finding user'});
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
                    tempUser.save(function (err) {
                        if(err) {
                            res.status(500).send('db error');
                        } else {
                            res.status(200).json({ msg : 'sign up successfully' });
                        }
                    });
                }
            }
        });
    });

    router.post('/login', passport.authenticate('local', { failureRedirect: '/failure' }), function (req, res) {
        res.status(200).json({msg: 'log in successfully', user: req.session.passport.user});
    });

    return router;
};
