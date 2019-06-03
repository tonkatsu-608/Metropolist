// ├── src
// │   ├── bin
// │   ├── db
// │   │   ├── Map.js
// │   │   ├── User.js
// │   ├── public
// │   │   ├── Frontend folder
// │   ├── routes
// │   │   ├── auth.js
// │   │   ├── index.js
// │   ├── app.js
// │   ├── passport.js
// │   ├── package.json
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const expressJwt = require('express-jwt');
const history = require('connect-history-api-fallback');

require('./passport')(passport);
mongoose.connect('mongodb://localhost:27017/metropolist', {useNewUrlParser: true});

var indexRouter = require('./routes/index');
var auth = require('./routes/auth')(passport);
var corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
var app = express();
app.use(history());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(sassMiddleware({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true, // true = .sass and false = .scss
    sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(session({
//     secret: '_metro_key',
//     saveUninitialized: false,
//     resave: false
// }));

app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsOptions));

app.use('/', indexRouter);
app.use('/metro/auth', auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.use(expressJwt({secret: '_metro_key'}).unless({path: ['/metro/auth']}));

module.exports = app;