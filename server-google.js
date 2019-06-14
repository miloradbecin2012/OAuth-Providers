require('dotenv').config();

var express = require('express');
var passport = require('passport');
var refresh = require('passport-oauth2-refresh')
var localStorage = require('localStorage');

var GoogleStrategy = require('passport-google-oauth20').Strategy;

const axios = require('axios');
const querystring = require('querystring');

const CLIENT_ID = '574524735992-8a4fd7iseopo8dv9nkmi6js7ol4s16o4.apps.googleusercontent.com';
const CLIENT_SECRET = 'G59Sf8Avza-40S_w6bf3oxSt';


// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new GoogleStrategy({
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  callbackURL: "http://localhost:8080/auth/google/callback"
},
  function (accessToken, refreshToken, profile, cb) {
    console.log('accessToken======', accessToken)
    console.log('refreshToken======', refreshToken)
    console.log('profile======', profile)

    localStorage.setItem('accessToken', JSON.stringify(accessToken));
    localStorage.setItem('refreshToken', JSON.stringify(refreshToken));

    return cb(null, profile);
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
  }
));

// refresh.use(new GoogleStrategy({
//   clientID: CLIENT_ID,
//   clientSecret: CLIENT_SECRET,
//   callbackURL: "http://localhost:8080/auth/google/callback"
// },
//   function (accessToken, refreshToken, profile, cb) {
//     return cb(null, profile);
//   }
// ));



// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});


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
    res.render('home', { user: req.user });
  });

app.get('/login',
  function (req, res) {
    res.render('login');
  });

app.get('/auth/google',
  passport.authenticate('google', { 
    accessType: 'offline',
    prompt: 'consent',
    scope: ['profile'],
  }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });


app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function (req, res) {
    var accessTokenObj = getNewAccessToken(CLIENT_ID, CLIENT_SECRET);
    res.render('profile', { user: req.user, accessTokenObj: accessTokenObj });
  });

function renewAccessToken() {
  var oldRefreshToken = localStorage.getItem('refreshToken');
  console.log('oldRefreshToken=====>', oldRefreshToken);

  refresh.requestNewAccessToken('google', oldRefreshToken, function(err, accessToken, refreshToken) {
    // You have a new access token, store it in the user object,
    // or use it to make a new request.
    // `refreshToken` may or may not exist, depending on the strategy you are using.
    // You probably don't need it anyway, as according to the OAuth 2.0 spec,
    // it should be the same as the initial refresh token.
    if (!err) {
      console.log('new oldRefreshToken ===============================>', oldRefreshToken)
      console.log('new AccessToken ===============================>', accessToken)
      console.log('new refreshToken ===============================>', refreshToken)
    } else {
      console.log('renew accesstoken error ===================================>', err)
    }
  
  });
}

async function getNewAccessToken(googleClientID, googleClientSecret) {
  // var oldRefreshToken = localStorage.getItem('refreshToken');
  var oldRefreshToken = '1/zQU7fBGf-WRGRmLtvtLFpT5eIP197tZ2MjRdYDqr7F_UEqZ-Tu0b4bFJ386rBr1Z';
  console.log('oldRefreshToken ========>', oldRefreshToken)
    try {
      const accessTokenObj = await axios.post(
        'https://www.googleapis.com/oauth2/v4/token',
        querystring.stringify({
          // refresh_token: oldRefreshToken,
          refresh_token: oldRefreshToken,
          client_id: googleClientID,
          client_secret: googleClientSecret,
          grant_type: 'refresh_token'
        })
      );
      console.log('accessTokenObj =============================>', accessTokenObj.data)
      // return accessTokenObj.data.access_token;
      return accessTokenObj;
    } catch (err) {
      console.log('err *******************============**************', err);
    }
}



app.listen(process.env['PORT'] || 8080);