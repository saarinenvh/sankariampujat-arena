var bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const passport = require("passport");
const port = 5500;
const mysql = require("mysql");
const dotenv = require("dotenv");
const session = require("express-session");
const SteamStrategy = require("./lib/passport-steam").Strategy;
let Rcon = require("srcds-rcon");
let rcon = Rcon({
  address: process.env.RCON_ADDRESS,
  password: process.env.RCON_PASSWORD
});

var cors = require("cors");
dotenv.config();

let state = { playerPool: [], team1: [], team2: [] };
let votedto = {
  dust2: 0,
  inferno: 0,
  cache: 0,
  train: 0,
  overpass: 0,
  nuke: 0,
  mirage: 0,
  vertigo: 0
};
let votes = {
  dust2: [],
  inferno: [],
  cache: [],
  train: [],
  overpass: [],
  nuke: [],
  mirage: [],
  vertigo: []
};

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
passport.use(
  new SteamStrategy(
    {
      returnURL: process.env.STEAM_REDIRECT,
      realm: process.env.STEAM_REDIRECT,
      apiKey: process.env.STEAM_API_KEY
    },
    function(identifier, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function() {
        // To keep the example simple, the user's Steam profile is returned to
        // represent the logged-in user.  In a typical application, you would want
        // to associate the Steam account with a user record in your database,
        // and return that user instead.
        profile.identifier = identifier;
        return done(null, profile);
      });
    }
  )
);

app.use(cors());
app.use(bodyParser.j/root/.pm2/logs/server-error.log son());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(
  session({
    secret: "your secret",
    name: "name of session id",
    resave: true,
    saveUninitialized: true
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + "/../../public"));

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Steam profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.get(
  "/auth/steam",
  passport.authenticate("steam", { failureRedirect: "/" }),
  function(req, res) {
    res.redirect("");
  }
);

const user = [];

// GET /auth/steam/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  function(req, res) {
    if (Object.keys(req).includes("user")) {
      state.playerPool.push(req.user);
    }
    res.redirect("/");
  }
);

const server = app.listen(port, () => console.log(`Listening on port ${port}`));

let playerID;
const io = socketIo(server, { "force new connection": true });
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
    io.sockets.emit("VOTES", votedto); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
};

app.get("/api/getVotes", (req, res) => {
  res.send(votedto);
});

app.post("/api/updateVotes", (req, res) => {
  Object.keys(votes).forEach(n => {
    if (votes[n].find(i => i == req.user.id) !== undefined) {
      votes[n].splice(votes[n].findIndex(i => i == req.user.id), 1);
    }
  });

  votes[req.body.map].push(req.user.id);
  Object.keys(votes).forEach(n => (votedto[n] = votes[n].length));
  res.send(votedto);
});

app.get("/api/clearVotes", (req, res) => {
  Object.keys(votes).forEach(n => (votes[n] = []));
  Object.keys(votedto).forEach(n => (votedto[n] = 0));
  res.send(votedto);
});

app.post("/api/updateState", (req, res) => {
  state = req.body;
  res.send(state);
});

app.get("/api/getState", (req, res) => {
  res.send(state);
});

app.get("/api/validateSession", (req, res) => {
  if (Object.keys(req).includes("user")) {
    res.send(req.user);
  } else {
    res.send(undefined);
  }
});

function createTeamDTO(team) {
  const teamDTO = {};
  team.map(n => {
    teamDTO[n.id] = n.displayName;
  });
  return teamDTO;
}

function createMatch() {
  const map =
    "de_" +
    Object.keys(votedto).reduce((a, b) => (votedto[a] > votedto[b] ? a : b));

  const matchConfig = {
    matchid: "SankariBattle",
    num_maps: 1,
    players_per_team: 5,
    min_players_to_ready: 1,
    min_spectators_to_ready: 0,
    skip_veto: true,
    side_type: "standard",
    maplist: [map],

    team1: {
      name: "Team " + state.team1[0].displayName,
      players: createTeamDTO(state.team1)
    },

    team2: {
      name: "Team " + state.team2[0].displayName,
      players: createTeamDTO(state.team2)
    },

    cvars: {
      hostname: "SankariArena"
    }
  };

  return matchConfig;
}

app.get("/startgame", (req, res) => {
  rcon.connect().then(() => {
    rcon.command("quit").then(console.log("RESTART SUCCESS"), console.error("RESTART FAILED"));
  });

  setTimeout(() => {
    rcon.connect().then(() => {
      rcon.command("get5_loadmatch_url 167.172.166.236/api/loagMatchConfig").then(console.log("MATCH CONFIG LOADED SUCCESFULLY"), console.error("ERROR LOADING MATCH CONFIG"));
    });
  }, 5000);

  res.send({ game: "started" });
});

app.get("/api/loadMatchConfig", (req, res) => {
  const matchConfig = createMatch();
  res.send(matchConfig);
});
