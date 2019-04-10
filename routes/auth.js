var express = require('express');
var router = express.Router();
var User = require('../db/User');

module.exports = function (passport) {
    router.post('/signup', function(req, res) {
        let user = req.body;
        console.log("user: ", user);
        User.findByEmail(user.email, function (err, doc) {
            if (err) {
                res.status(500).send({msg: 'error occur in finding user'});
            } else {
                if (doc) {
                    res.status(409).send({msg: 'sorry, email already exists'});
                }else{
                    let tempUser = new User();
                    tempUser.email = user.email;
                    tempUser.firstname = user.firstname;
                    tempUser.lastname = user.lastname;
                    tempUser.password = tempUser.hashPassword(user.password);
                    tempUser.role = user.role || "user";
                    tempUser.enabled = user.enabled || true;
                    tempUser.avatar = user.avatar || "";
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
        if(req.session.passport.user.enabled === false) {
            res.status(500).json({msg: 'your account was blocked, please email administrator to unlock: admin@admin'})
        } else {
            res.status(200).json({msg: 'log in successfully', user: new User().transformUser(req.session.passport.user)});
        }
    });

    return router;
};
