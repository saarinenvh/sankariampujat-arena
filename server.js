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
var cors = require("cors");
dotenv.config();

// INIT APP FOR API PURPOSES

// IINIT RCON CONNECTION
let Rcon = require("srcds-rcon");
let rcon = Rcon({
  address: process.env.RCON_ADDRESS,
  password: process.env.RCON_PASSWORD
});

// INIT STATE VARIABLES TODO MOVE THESE TO DB
let connectedUsers = [];
let state = {
  status: "INIT",
  playerPool: [],
  team1: [],
  team2: [],
  data: {},
  user: undefined
};
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

// CREATE DB CONNECTION
let connection = mysql.createConnection({
  host: process.env.DB_HOST, // eslint-disable-line
  user: process.env.DB_USERNAME, // eslint-disable-line
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD, // eslint-disable-line
  database: process.env.DB_NAME // eslint-disable-line
});

connection.connect(function(err) {
  if (err) throw err;
});

// INIT PASSPORT FOT STEAM LOGIN
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(
  new SteamStrategy(
    {
      returnURL: process.env.STEAM_REDIRECT,
      realm: process.env.STEAM_REDIRECT,
      apiKey: process.env.STEAM_API_KEY
    },
    function(identifier, profile, done) {
      process.nextTick(function() {
        profile.identifier = identifier;
        return done(null, profile);
      });
    }
  )
);

app.use(cors());
app.use(bodyParser.json());
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

app.get(
  "/auth/steam",
  passport.authenticate("steam", { failureRedirect: "/" }),
  function(req, res) {
    res.redirect("");
  }
);

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  function(req, res) {
    if (Object.keys(req).includes("user")) {
      connectedUsers.push(req.user);
    }
    res.redirect("/");
  }
);

app.get("/api/logout", (req, res) => {
  if (connectedUsers.find(n => n.id === req.user.id))
    connectedUsers.splice(
      connectedUsers.findIndex(n => n.id === req.user.id),
      1
    );
  if (state.playerPool.find(n => n.id === req.user.id))
    state.playerPool.splice(
      state.playerPool.findIndex(n => n.id === req.user.id),
      1
    );
  if (state.team1.find(n => n.id === req.user.id))
    state.team1.splice(state.team1.findIndex(n => n.id === req.user.id), 1);
  if (state.team2.find(n => n.id === req.user.id))
    state.team2.splice(state.team2.findIndex(n => n.id === req.user.id), 1);
  req.logout();
  res.send({ user: undefined });
});

//START SERVER
const server = app.listen(port, () => console.log(`Listening on port ${port}`));

// HANDLING SOCKET
const io = socketIo(server, { "force new connection": true });

// API FOR HANDLING FRONT
app.get("/api/getVotes", (req, res) => {
  res.send(votedto);
});

app.get("/api/getState", (req, res) => {
  res.send(state);
});

app.post("/api/updateVotes", (req, res) => {
  Object.keys(votes).forEach(n => {
    if (votes[n].find(i => i == req.user.id) !== undefined) {
      votes[n].splice(votes[n].findIndex(i => i == req.user.id), 1);
    }
  });

  votes[req.body.map].push(req.user.id);
  Object.keys(votes).forEach(n => (votedto[n] = votes[n].length));
  try {
    res.send(votedto);
    io.sockets.emit("VOTES", votedto); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
});

app.get("/api/clearVotes", (req, res) => {
  Object.keys(votes).forEach(n => (votes[n] = []));
  Object.keys(votedto).forEach(n => (votedto[n] = 0));
  try {
    res.send(votedto);
    io.sockets.emit("VOTES", votedto); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
});

app.post("/api/updateState", (req, res) => {
  state = req.body;
  try {
    res.send(state);
    io.sockets.emit("STATE", state); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
});

app.get("/api/joinToPlayerPool", (req, res) => {
  state.playerPool.push(req.user);

  try {
    res.send(state);
    io.sockets.emit("STATE", state); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
});

app.get("/api/leavePlayerPool", (req, res) => {
  state.playerPool.splice(
    state.playerPool.findIndex(n => n.id == req.user.id),
    1
  );

  try {
    res.send(state);
    io.sockets.emit("STATE", state); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
});

app.get("/api/validateSession", (req, res) => {
  if (Object.keys(req).includes("user")) {
    res.send({ user: req.user });
  } else {
    res.send({ user: undefined });
  }
});

app.get("/api/initNewGame", (req, res) => {
  state.status = "INIT";
  state.playerPool = [];
  state.team1 = [];
  state.team2 = [];
  Object.keys(votedto).forEach((item, i) => {
    votedto[item] = 0;
  });
  Object.keys(votes).forEach((item, i) => {
    votes[item] = [];
  });

  try {
    io.sockets.emit("STATE", state); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
});

//GET5_APISTATS

app.post("/api/match/:id/map/:map/start", (req, res) => {
  state.status = "LIVE";
  console.log(req);
  Object.assign(req.body, state.data);
  console.log(state.data);
});

app.post("/api/match/:id/map/:map/finish", (req, res) => {
  state.status = "FINISHED";
  console.log(req);
  Object.assign(req.body, state.data);
  console.log(state.data);
  rcon.connect().then(() => {
    console.log;
    rcon.command("quit").then(console.log("RESTART SUCCESS"));
  });
  try {
    res.send(state);
    io.sockets.emit("STATE", state); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
});

app.post("/api/match/:id/map/:map/update", (req, res) => {
  console.log(req);
  Object.assign(req.body, state.data);
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
      hostname: "SankariArena",
      get5_web_api_url: "http://167.172.166.236/api/",
      get5_web_api_key: "test"
    }
  };

  return matchConfig;
}

app.get("/api/startGame", (req, res) => {
  setTimeout(() => {
    rcon.connect().then(() => {
      rcon
        .command("get5_loadmatch_url 167.172.166.236/api/loadMatchConfig")
        .then(console.log("MATCH CONFIG LOADED SUCCESFULLY"));
    });
  }, 30000);
  state.status = "STARTING";
  try {
    res.send(state);
    io.sockets.emit("STATE", state); // Emitting a new message. It will be consumed by the client
  } catch (error) {
    console.error(`Error: ${error.code}`);
  }
});

app.get("/api/loadMatchConfig", (req, res) => {
  const matchConfig = createMatch();
  res.send(matchConfig);
});

// app.get("/api/getPracMode", (res, req) => {
//   rcon.connect().then(() => {
//     rcon.command("get5_check_auths").then(auths => {
//       auths === 0 ? (state.praccMode = false) : (state.praccMode = true);
//     });
//   });
//   res.send(state.praccMode);
// });
//
// app.get("/api/togglePracMode", (res, req) => {
//   rcon.connect().then(() => {
//     rcon.command("get5_check_auths").then(auths => {
//       auths === 0 ? (state.praccMode = false) : (state.praccMode = true);
//     });
//   });
//
//   rcon.connect().then(() => {
//     const newMode = state.praccMode === 0 ? 1 : 0;
//     rcon
//       .command(`get5_check_auths ${newMode}`)
//       .then(console.log("TOGGLED AUTH REQUIREMENTS"));
//   });
//
//   state.praccMode = newMode === 1 ? true : false;
//   res.send(state.praccMode);
// });

// API FOR MYSQL

// async function fetchPlayersMatches(steamId) {
//   let data = await new Promise((res, rej) => {
//     mysql.query(
//       `SELECT * FROM get5_stats_players JOIN get5_stats_matches on get5_stats_players.matchid = get5_stats_matches.matchid where get5_stats_players.steamid64 = ${steamid64}`,
//       function(error, results, fields) {
//         if (error) {
//           Logger.info(error);
//         } else {
//           res(results);
//         }
//       }
//     );
//   });
//   return JSON.parse(JSON.stringify(data));
// }
//
// async function fetchMatchStats(matchId) {
//   let data = await new Promise((res, rej) => {
//     mysql.query(
//       `SELECT * FROM get5_stats_players WHERE matchid = ${matchId}`,
//       function(error, results, fields) {
//         if (error) {
//           Logger.info(error);
//         } else {
//           res(results);
//         }
//       }
//     );
//   });
//   return JSON.parse(JSON.stringify(data));
// }
//
// async function fetchPlayerOverallStatistics(steamid64) {
//   let data = await new Promise((res, rej) => {
//     mysql.query(
//       `SELECT * FROM get5_stats_players JOIN get5_stats_matches on get5_stats_players.matchid = get5_stats_matches.matchid where get5_stats_players.steamid64 = ${steamid64}`,
//       function(error, results, fields) {
//         if (error) {
//           Logger.info(error);
//         } else {
//           res(results);
//         }
//       }
//     );
//   });
//   return JSON.parse(JSON.stringify(data));
// }
//
// app.get("/api/getPlayerMatches/:id", async (req, res) => {
//   const steamId = req.params.id;
//   data = await fetchPlayersMatches(steamId);
//   res.send(data);
// });
