var bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const port = 5500;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
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
var io = require('socket.io').listen(server);
let interval;

io.on("connection", socket => {
  console.log("New client connected");
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const getApiAndEmit = async socket => {
  try {
      socket.emit("STATE", state); // Emitting a new message. It will be consumed by the client
      socket.emit("VOTES", votes); // Emitting a new message. It will be consumed by the client
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
