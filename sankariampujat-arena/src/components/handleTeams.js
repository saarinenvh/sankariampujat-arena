import React from "react";
import Team from "./team";
import MapVote from "./mapVote"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

class HandleTeams extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newPlayer: "",
      playerPool: [],
      team1: [],
      team2: [],
    };
  }

  componentDidMount() {
      // Call our fetch function below once the component mounts
    this.getFromBackEndAPI('/getState')
      .then(res => this.setState(res), () => { console.log(this.state)})
      .catch(err => console.log(err));
  }
    // Fetches our GET route from the Express server. (Note the route we are fetching matches the GET route from server.js
  getFromBackEndAPI = async (url) => {
    const response = await fetch(url);
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message)
    }
    return body;
  };

  postToBackEndApi = async (url, body) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    this.setState(data, () => {console.log(this.state)});
}

  async assignToTeam(player, team) {
    let pool = this.state.playerPool;
    pool.splice(pool.findIndex(n => n.id === player.id), 1);
    const newState = this.state
    newState.playerPool = pool
    team === 1 ? newState.team1.push(player) : newState.team2.push(player);
    this.postToBackEndApi('/updateState', newState)
  }

  async deletePlayer(player) {
    let pool = this.state.playerPool;
    pool.splice(pool.findIndex(n => n.id === player.id), 1);
    const newState = this.state;
    newState.playerPool = pool;
    this.postToBackEndApi('/updateState', newState)
  }

  createNewPlayer() {
    const newPlayer = { id: Date.now(), name: this.state.newPlayer };
    this.addPlayerToPool(newPlayer);
  }

  async addPlayerToPool(player) {
    let pool = this.state.playerPool;
    pool.push(player);
    const newState = this.state
    newState['playerPool'] = pool
    await this.postToBackEndApi('/updateState', newState)
    this.setState({newPlayer: ""})
  }

  handleChange(event) {
    this.setState({ newPlayer: event.target.value }, () => {});
  }

  async emptyTeams() {
    let pool = this.state.team1.concat(this.state.team2);
    pool = pool.concat(this.state.playerPool);
    const newState = this.state
    newState.playerPool = pool;
    newState.team1 = [];
    newState.team2 = [];
    this.postToBackEndApi('/updateState', newState)
  }

  async removeAllPlayers() {
    const newState = this.state
    newState.playerPool = [];
    this.postToBackEndApi('/updateState', newState)
  }

  randomizeTeams() {
    // Empty teams and put them to playerPool
    let pool = this.state.team1.concat(this.state.team2);
    pool = pool.concat(this.state.playerPool);
    const newState = { playerPool: pool, team1: [], team2: [] }
    newState.playerPool.forEach(n => {
        if (Math.floor(Math.random() * 2) === 1) {
          if (newState.team1.length < newState.playerPool.length / 2) {
            newState.team1.push(n);
          } else {
            newState.team2.push(n);
          }
        } else {
          if (newState.team2.length < newState.playerPool.length / 2) {
            newState.team2.push(n);
          } else {
            newState.team1.push(n);
          }
        }
      });
    newState.playerPool = [];
    this.postToBackEndApi('/updateState', newState)
  }

  playerFromTeamToPool = async (e) => {
    let pool = this.state.playerPool;
    pool.push(e);
    const newState = this.state;
    const index1 = newState.team1.findIndex(n => n.id === e.id)
    const index2 = newState.team2.findIndex(n => n.id === e.id)
    index1 !== -1 ? newState.team1.splice(index1,1) : newState.team2.splice(index2, 1)
    newState.playerPool = pool;
    this.postToBackEndApi('/updateState', newState)
  };

  generatePlayerPool() {
    if (Object.keys(this.state).includes("playerPool")) {
      return this.state.playerPool.map((n, i) => (
        <div className="row" key={n + i}>
          <div className="col-md-10">{n.name}</div>
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
      return (<div><p>No players in this team.</p></div>)
    }

  }

  handleSubmit(e) {
    e.preventDefault();
    this.addPlayerToPool(e);
  }

  render() {
    return (
      <div className="whole">
        <div className="main mb-3">
          <div className="row ml-2 mr-2">
            <div className="col">
              <h1>Add new player</h1>
            </div>
            <div className="col">
              <form
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
              </form>
            </div>
          </div>
        </div>

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
                  <div className="playerList">{this.generatePlayerPool()}</div>
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
                key={this.state.team1}
                parentCallback={this.playerFromTeamToPool}
                players={this.state.team1}
              ></Team>
            </div>
            <div className="col">
              <h1>Team2</h1>
              <Team
                key={this.state.team2}
                parentCallback={this.playerFromTeamToPool}
                players={this.state.team2}
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
              <MapVote votes={this.state.votes}></MapVote>
          </div>
        </div>
      </div>
    </div>
  </div>
    );
  }
}

export default HandleTeams;
