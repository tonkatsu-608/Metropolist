var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var sassMiddleware = require('node-sass-middleware');
var mongoose = require('mongoose');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var cors = require('cors')

require('./passport')(passport);
mongoose.connect('mongodb://localhost:27017/metropolist', { useNewUrlParser: true });

var indexRouter = require('./routes/index');
var auth = require('./routes/auth')(passport);
var corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
var app = express();
// app.listen(8000, () => {
//     console.log('Port: 8000 started!');
// });

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
app.use(session({
    secret: 'metro',
    saveUninitialized: false,
    resave: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsOptions));

app.use('/', indexRouter);
app.use('/metro/auth', auth);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;