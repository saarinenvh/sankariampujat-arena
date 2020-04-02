var bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const passport = require("passport");
const port = 5500;
const mysql = require("mysql");
const dotenv = require("dotenv");
const session = require('express-session')
const SteamStrategy = require('./lib/passport-steam').Strategy;
var cors = require('cors');
dotenv.config();

let connection = mysql.createConnection({
  host: process.env.DB_HOST, // eslint-disable-line
  user: process.env.DB_USERNAME, // eslint-disable-line
  password: process.env.DB_PASSWORD, // eslint-disable-line
  database: process.env.DB_NAME // eslint-disable-line
});

connection.connect(function(err) {
  if (err) throw err;
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Use the SteamStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: '3BA6538EC4D48CF4ECA6BCDAF1D5F653'
  },
  function(identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Steam profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Steam account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;
      return done(null, profile);
    });
  }
));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(session({
    secret: 'your secret',
    name: 'name of session id',
    resave: true,
    saveUninitialized: true}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/../../public'));

app.get('/auth/steam',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    console.log(res)
    res.redirect('/');
  });

// GET /auth/steam/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    console.log(res)
    res.redirect('/');
  });

const server = app.listen(port, () => console.log(`Listening on port ${port}`));

let state = { playerPool: [], team1: [], team2: [] };
let votes = {
    dust2: 0,
    inferno: 0,
    cache: 0,
    train: 0,
    overpass: 0,
    nuke: 0,
    vertigo: 0
};

let playerID;
const io = socketIo(server, {'force new connection': true });
let interval;

io.sockets.on("connection", socket => {
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
});

const getApiAndEmit = async socket => {
  try {
      io.sockets.emit("STATE", state); // Emitting a new message. It will be consumed by the client
      io.sockets.emit("VOTES", votes); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
};

app.get("/api/getVotes", (req, res) => {
  res.send(votes);
});

app.post("/api/updateVotes", (req, res) => {
  votes = req.body
  res.send(votes);
});

app.post("/api/updateState", (req, res) => {
  state = req.body;
  res.send(state);
});


app.get("/api/getState", (req, res) => {
  res.send(state);
});
