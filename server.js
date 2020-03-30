const express = require("express");
const app = express();
var bodyParser = require("body-parser");
const port = process.env.PORT || 5500;

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
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get("/api/getVotes", (req, res) => {
  res.send(votes);
});

app.post("/api/updateVotes", (req, res) => {
  votes = req.body;
  res.send(votes);
});

app.post("/api/updateState", (req, res) => {
  state = req.body;
  res.send(state);
});

app.post("/api/updateTeam1", (req, res) => {
  this.state.team1 = req.data;
  res.send(state);
});

app.post("/api/updateTeam2", (req, res) => {
  this.state.team1 = req.data;
  res.send(state);
});

app.get("/api/getState", (req, res) => {
  res.send(state);
});

// console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`));
