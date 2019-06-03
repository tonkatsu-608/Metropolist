const localStrategy = require('passport-local').Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const User = require('./db/User');

const passportOpts = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: '_metro_key'
};

module.exports = function (passport) {
    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });

    passport.use(new localStrategy(
        function (username, password, done) {
            User.findByEmail(username, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false);
                }
                if (!user.verifyPassword(password, user.password)) {
                    return done(null, false);
                }
                return done(null, user);
            });
        }));

    passport.use(new JWTStrategy(passportOpts, function (jwtPayload, done) {
        const expirationDate = new Date(jwtPayload.exp * 1000);
        if (expirationDate < new Date()) {
            return done(null, false);
        }
        done(null, jwtPayload);
    }))
}