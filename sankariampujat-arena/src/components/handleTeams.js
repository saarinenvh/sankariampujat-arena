import React from "react";
import Team from "./team";
import MapVote from "./mapVote";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import socketIOClient from "socket.io-client";
import steam from "../files/steam.jpg";
import { v4 as uuidv4 } from "uuid";

class HandleTeams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      serverData: {
        playerPool: [],
        team1: [],
        team2: []
      },
      user: undefined,
      votes: {},
      newPlayer: "",
      endpoint: "http://167.172.166.236:5500"
    };
  }

  async checkIfAuthenticated() {
    const user = await this.getFromBackEndAPI("/api/validateSession");
    if (user) this.setState({ user: user });
  }

  componentDidMount() {
    this.checkIfAuthenticated();
    // Call our fetch function below once the component mounts
    this.getFromBackEndAPI("/api/getState")
      .then(res => this.setState({ serverData: res }), () => {})
      .catch(err => console.log(err));

    this.getFromBackEndAPI("/api/getVotes")
      .then(res => {
        this.setState({ votes: res }, () => console.log(this.state));
      })
      .catch(err => console.log(err));

    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on("STATE", data => this.setState({ serverData: data }));
    socket.on("VOTES", data => this.setState({ votes: data }));
  }

  getFromBackEndAPI = async url => {
    const response = await fetch(url);
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }
    return body;
  };

  postToBackEndApi = async (url, body) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    };
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    this.setState({ serverData: data }, () => {});
  };

  async assignToTeam(player, team) {
    let pool = this.state.serverData.playerPool;
    pool.splice(pool.findIndex(n => n.id === player.id), 1);
    const newState = this.state.serverData;
    newState.playerPool = pool;
    team === 1 ? newState.team1.push(player) : newState.team2.push(player);
    this.postToBackEndApi("/api/updateState", newState);
  }

  async deletePlayer(player) {
    let pool = this.state.serverData.playerPool;
    pool.splice(pool.findIndex(n => n.id === player.id), 1);
    const newState = this.state.serverData;
    newState.playerPool = pool;
    this.postToBackEndApi("/api/updateState", newState);
  }

  createNewPlayer() {
    const newPlayer = { id: uuidv4(), name: this.state.newPlayer };
    this.addPlayerToPool(newPlayer);
  }

  async addPlayerToPool(player) {
    let pool = this.state.serverData.playerPool;
    pool.push(player);
    const newState = this.state.serverData;
    newState["playerPool"] = pool;
    await this.postToBackEndApi("/api/updateState", newState);
    this.setState({ newPlayer: "" });
  }

  handleChange(event) {
    this.setState({ newPlayer: event.target.value }, () => {});
  }

  async emptyTeams() {
    let pool = this.state.serverData.team1.concat(this.state.serverData.team2);
    pool = pool.concat(this.state.serverData.playerPool);
    const newState = this.state.serverData;
    newState.playerPool = pool;
    newState.team1 = [];
    newState.team2 = [];
    this.postToBackEndApi("/api/updateState", newState);
  }

  async removeAllPlayers() {
    const newState = this.state.serverData;
    newState.playerPool = [];
    this.postToBackEndApi("/api/updateState", newState);
  }

  shuffleArray(array) {
    console.log(array);
    let i = array.length;
    while (i--) {
      const ri = Math.floor(Math.random() * (i + 1));
      [array[i], array[ri]] = [array[ri], array[i]];
    }
    return array;
  }

  randomizeTeams() {
    // Empty teams and put them to playerPool
    const newState = { playerPool: [], team1: [], team2: [] };
    newState.playerPool = newState.playerPool.concat(
      this.state.serverData.team1
    );
    newState.playerPool = newState.playerPool.concat(
      this.state.serverData.team2
    );
    newState.playerPool = newState.playerPool.concat(
      this.state.serverData.playerPool
    );

    newState.playerPool = this.shuffleArray(newState.playerPool);
    newState.team1 = newState.playerPool.splice(
      0,
      Math.floor(newState.playerPool.length / 2)
    );
    newState.team2 = newState.playerPool;

    // newState.playerPool.forEach(n => {
    //     if (Math.floor(Math.random() * 2) === 1) {
    //       if (newState.team1.length < newState.playerPool.length / 2) {
    //         newState.team1.push(n);
    //       } else {
    //         newState.team2.push(n);
    //       }
    //     } else {
    //       if (newState.team2.length < newState.playerPool.length / 2) {
    //         newState.team2.push(n);
    //       } else {
    //         newState.team1.push(n);
    //       }
    //     }
    //   });

    newState.playerPool = [];
    this.postToBackEndApi("/api/updateState", newState);
  }

  startGame() {
    this.getFromBackEndAPI("/api/startGame");
  }

  handleAuth() {
    this.getFromBackEndAPI("/auth/steam");
  }

  playerFromTeamToPool = async e => {
    let pool = this.state.serverData.playerPool;
    pool.push(e);
    const newState = this.state.serverData;
    const index1 = newState.team1.findIndex(n => n.id === e.id);
    const index2 = newState.team2.findIndex(n => n.id === e.id);
    index1 !== -1
      ? newState.team1.splice(index1, 1)
      : newState.team2.splice(index2, 1);
    newState.playerPool = pool;
    this.postToBackEndApi("/api/updateState", newState);
  };

  generatePlayerPool() {
    if (Object.keys(this.state.serverData).includes("playerPool")) {
      return this.state.serverData.playerPool.map((n, i) => (
        <div className="row" key={uuidv4()}>
          <div className="col-md-10">{n.displayName}</div>
          <div className="col-md-2">
            <span
              className="teamNumber link mr-4"
              onClick={() => this.assignToTeam(n, 1)}
            >
              1
            </span>
            <span
              className="teamNumber link mr-4"
              onClick={() => this.assignToTeam(n, 2)}
            >
              2
            </span>
            <span onClick={() => this.deletePlayer(n)}>
              <FontAwesomeIcon className="link trash" icon={faTrash} />
            </span>
          </div>
        </div>
      ));
    } else {
      return (
        <div>
          <p>No players in this team.</p>
        </div>
      );
    }
  }

  handleSubmit(e) {
    e.preventDefault();
    this.createNewPlayer();
  }

  render() {
    return (
      <div className="whole">
        {this.state.user === undefined ? (
          <div className="main mb-3">
            <div className="row ml-2 mr-2">
              <div className="col">
                <h1>Join to game</h1>
              </div>
              <div className="col">
                <a href="/auth/steam">
                  <img src={steam} alt="Sign in through steam"></img>
                </a>
                {/* <form
                        className="form-inline justify-content-center"
                        onSubmit={e => {
                          this.handleSubmit(e);
                        }}
                      >
                        <div className="form-group">
                          <label className="mr-2">Name </label>
                          <input
                            className="form-control mr-2"
                            value={this.state.newPlayer}
                            onChange={this.handleChange.bind(this)}
                            id="playerName"
                          ></input>
                        </div>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => {
                            this.createNewPlayer();
                          }}
                        >
                          Add
                        </button>
                      </form> */}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="main mb-3">
              <div className="row ml-2 mr-2">
                <div className="col">
                  <h1>Player Pool</h1>
                </div>
              </div>

              <div className="row">
                <div className="col">
                  <div className="card">
                    <div className="card-body">
                      <div className="playerList">
                        {this.generatePlayerPool()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row mt-2">
                <div className="col">
                  <button
                    className="btn btn-primary float-right"
                    onClick={() => {
                      this.removeAllPlayers();
                    }}
                  >
                    Remove all players
                  </button>
                </div>
              </div>
            </div>

            <div className="main mb-3">
              <div className="teamsSection">
                <div className="row  ml-2 mr-2">
                  <div className="col">
                    <h1>Team1</h1>
                    <Team
                      key={uuidv4()}
                      parentCallback={this.playerFromTeamToPool}
                      players={this.state.serverData.team1}
                    ></Team>
                  </div>
                  <div className="col">
                    <h1>Team2</h1>
                    <Team
                      key={uuidv4()}
                      parentCallback={this.playerFromTeamToPool}
                      players={this.state.serverData.team2}
                    ></Team>
                  </div>
                </div>
              </div>
              <div className="row mt-3 ml-2 mr-2 ">
                <div className="col">
                  <button
                    className="btn btn-primary float-right ml-2"
                    onClick={() => {
                      this.randomizeTeams();
                    }}
                  >
                    Randomize
                  </button>
                  <button
                    className="btn btn-primary float-right"
                    onClick={() => {
                      this.emptyTeams();
                    }}
                  >
                    Empty Teams
                  </button>
                </div>
              </div>
            </div>

            <div className="main mb-3">
              <div className="mapVote">
                <div className="row  ml-2 mr-2">
                  <div className="col">
                    <MapVote key={uuidv4()} votes={this.state.votes}></MapVote>
                  </div>
                </div>
              </div>
            </div>

            <div className="main mb-3">
              <div className="mapVote">
                <div className="row  ml-2 mr-2">
                  <div className="col">
                    <button
                      className="btn btn-primary"
                      onClick={() => this.startGame()}
                    >
                      Start Game!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default HandleTeams;
