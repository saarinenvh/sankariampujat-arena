import React from "react";
import Team from "./team";
import MapVote from "./mapVote";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import socketIOClient from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

class HandleTeams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      serverData: {
        user: undefined,
        playerPool: [],
        team1: [],
        team2: []
      },

      votes: {},
      newPlayer: "",
      endpoint: "http://localhost:5500"
    };
  }

  async checkIfAuthenticated() {
    let user = await this.getFromBackEndAPI("/api/validateSession");
    const newState = this.state.serverData;
    newState.user = user;
    if (user) this.setState(newState);
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

  joinPool() {
    this.setState(this.getFromBackEndAPI("/api/joinToPlayerPool"));
  }

  leavePool() {
    this.setState(this.getFromBackEndAPI("/api/leavePlayerPool"));
  }

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
    const newState = JSON.parse(JSON.stringify(this.state.serverData));
    newState.playerPool = [];
    newState.team1 = [];
    newState.team2 = [];

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
    newState.playerPool = [];
    console.log(newState);
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
    if (
      Object.keys(this.state.serverData).includes("playerPool") &&
      this.state.serverData.playerPool.length > 0
    ) {
      return this.state.serverData.playerPool.map((n, i) => (
        <div className="row name" key={uuidv4()}>
          <div className="col-md-10">
            <span className="mr-2">{i + 1}.</span>
            {n.displayName}
          </div>
          {n.id === this.state.serverData.user.id ||
          this.state.serverData.user.displayName === "vhs" ? (
            <div className="col-md-2 float-right">
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
          ) : (
            <div></div>
          )}
        </div>
      ));
    } else {
      return (
        <div className="text-center p-3">
          <p>No players in Player Pool</p>
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
        {this.state.serverData.user === undefined ? (
          <div className="headerContainer mt-5 animate">
            <div className="row ml-2 mr-2">
              <div className="col">
                <h1 className="headerTitle text-center">
                  Join the game
                  <span className="ml-3 steamsign">
                    <a className="not-active" href="/auth/steam">
                      HERE.
                    </a>
                  </span>
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="main mb-3 animate">
              <div className="row ml-2 mr-2">
                <div className="col">
                  <h1>Player Pool</h1>
                </div>
                <div className="col-md-6 pr-0">
                  {!this.state.serverData.playerPool.find(
                    n => n.id === this.state.serverData.user.id
                  ) &&
                  !this.state.serverData.team1.find(
                    n => n.id === this.state.serverData.user.id
                  ) &&
                  !this.state.serverData.team2.find(
                    n => n.id === this.state.serverData.user.id
                  ) ? (
                    <h4
                      onClick={() => {
                        this.joinPool();
                      }}
                      className="float-right join"
                    >
                      Join Player Pool
                      <span className="ml-2">
                        <FontAwesomeIcon
                          flip="horizontal"
                          className="userplus"
                          icon={faUserPlus}
                        />
                      </span>
                    </h4>
                  ) : (
                    <div></div>
                  )}
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
                    className="btn btn-primary float-right ml-2"
                    onClick={() => {
                      this.removeAllPlayers();
                    }}
                  >
                    Empty Player Pool
                  </button>
                  <button
                    className="btn btn-primary float-right ml-2"
                    onClick={() => {
                      this.randomizeTeams();
                    }}
                  >
                    Assign players to teams
                  </button>
                </div>
              </div>
            </div>

            <div className="main mb-3 animate">
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

            <div id="mapVoteContainer" className="main mb-3 animate">
              <div className="mapVote">
                <div className="row ml-2 mr-2">
                  <div className="col">
                    <MapVote key={uuidv4()} votes={this.state.votes}></MapVote>
                  </div>
                </div>
                <div className="startGame">
                  <div className="row  ml-2 mr-2">
                    <div className="col justify-content-center">
                      <button
                        className="btn btn-lg btn-primary"
                        onClick={() => this.startGame()}
                      >
                        Start Game!
                      </button>
                    </div>
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
