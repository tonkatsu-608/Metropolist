var localStrategy = require('passport-local').Strategy;
var User = require('./db/User');

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
                if (err) { return done(err); }
                if (!user) { return done(null, false); }
                if (!user.verifyPassword(password, user.password)) { return done(null, false); }
                return done(null, user);
            });
        }));
}