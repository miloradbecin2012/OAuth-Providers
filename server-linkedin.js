require('dotenv').config();

var express = require('express');
var passport = require('passport');
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

const LINKEDIN_KEY = '77otdbghp9tzgr';
const LINKEDIN_SECRET = 'yjjTX4C5AafYujKz';

passport.use(new LinkedInStrategy
  ({
  clientID: LINKEDIN_KEY,
  clientSecret: LINKEDIN_SECRET,
  // callbackURL: "http://127.0.0.1:8080/auth/linkedin/callback",
  callbackURL: "http://localhost:8080/auth/linkedin/callback",
  profileFields: [
    "email-address",
],
scope: ["r_basicprofile", "r_emailaddress"],
}, function(accessToken, refreshToken, profile, done) {
  console.log('accessToken==============.>>>', accessToken)
  // asynchronous verification, for effect...
  process.nextTick(function () {
    // To keep the example simple, the user's LinkedIn profile is returned to
    // represent the logged-in user. In a typical application, you would want
    // to associate the LinkedIn account with a user record in your database,
    // and return that user instead.
    return done(null, profile);
  });
}));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
// passport.serializeUser(function (user, cb) {
//   cb(null, user);
// });

// passport.deserializeUser(function (obj, cb) {
//   cb(null, obj);
// });


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
  function (req, res) {
    console.log('linkedin res ==============')
    res.render('home', { user: req.user });
  });


app.get('/auth/linkedin',
  // passport.authenticate('linkedin', { state: 'SOME STATE' }),
  passport.authenticate('linkedin', { state: true }),
  function (req, res) {
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  });

  app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));


app.get('/login',
  function (req, res) {
    res.render('login');
  });

app.get('/login/facebook',
  passport.authenticate('facebook'));

app.get('/return',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function (req, res) {
    res.render('profile', { user: req.user });
  });

app.listen(process.env['PORT'] || 8080);
