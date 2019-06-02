const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const randtoken = require('rand-token');
const User = require('../db/User');

module.exports = function (passport) {
    router.post('/signup', function (req, res) {
        let user = req.body;
        User.findByEmail(user.email, function (err, doc) {
            if (err) {
                res.status(401).send({msg: 'error occur in finding user'});
            } else {
                if (doc) {
                    res.status(409).send({msg: 'sorry, email already exists'});
                } else {
                    let tempUser = new User();
                    tempUser.email = user.email;
                    tempUser.firstname = user.firstname;
                    tempUser.lastname = user.lastname;
                    tempUser.password = tempUser.hashPassword(user.password);
                    tempUser.role = user.role || "user";
                    tempUser.enabled = user.enabled || true;
                    tempUser.avatar = user.avatar || "";
                    tempUser.save(function (err) {
                        if (err) {
                            res.status(500).send('db error');
                        } else {
                            res.status(200).json({msg: 'sign up successfully'});
                        }
                    });
                }
            }
        });
    });

    const refreshTokens = {};
    const jwtKey = '_metro_key';

    router.post('/login', passport.authenticate('local', {failureRedirect: '/failure'}), function (req, res) {
        if (req.session.passport.user.enabled === false) {
            res.status(403).json({
                msg: 'sorry, your account was blocked, please email administrator to unlock: yang.haleyysz@gmail.com',
                status: 'blocked'
            });
        }
        else {
            const uid = new User().transformUser(req.session.passport.user).id;
            const token = jwt.sign({uid: uid}, jwtKey, {
                algorithm: 'HS256',
                expiresIn: '2h'
            });
            const jwtExpirySeconds = 7200;
            const refreshToken = randtoken.uid(256);

            // res.cookie('token', token, { maxAge: jwtExpirySeconds * 1000, httpOnly:true, secure:true });
            refreshTokens[refreshToken] = uid;
            res.status(200).json({
                user: new User().transformUser(req.session.passport.user),
                tokens: {
                    jwt: token,
                    refreshToken: refreshToken
                }
            });
            // res.status(200).json({msg: 'log in successfully', user: new User().transformUser(req.session.passport.user)});
        }
    });

    router.post('/logout', function (req, res) {
        const refreshToken = req.body.refreshToken;
        if (refreshToken in refreshTokens) {
            delete refreshTokens[refreshToken];
        }
        req.logout();
        res.sendStatus(204);
    });

    router.post('/refresh', function (req, res) {
        const refreshToken = req.body.refreshToken;

        if (refreshToken in refreshTokens) {
            const uid = refreshTokens[refreshToken];
            const token = jwt.sign({uid: uid}, jwtKey, {
                algorithm: 'HS256',
                expiresIn: '2h'
            });
            res.status(200).json({jwt: token})
        }
        else {
            res.sendStatus(401);
        }
    });

    return router;
};
