import React from "react";
import * as asyncf from "./helperFunctions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";

class PlayerPool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      serverData: this.props.serverData
    };
  }

  async assignToTeam(player, team) {
    let pool = this.state.serverData.playerPool;
    pool.splice(pool.findIndex(n => n.id === player.id), 1);
    const newState = this.state.serverData;
    newState.playerPool = pool;
    team === 1 ? newState.team1.push(player) : newState.team2.push(player);
    asyncf.postToBackEndApi("/api/updateState", newState);
  }

  async deletePlayer(player) {
    let pool = this.state.serverData.playerPool;
    pool.splice(pool.findIndex(n => n.id === player.id), 1);
    const newState = this.state.serverData;
    newState.playerPool = pool;
    asyncf.postToBackEndApi("/api/updateState", newState);
  }

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
          {n.id === this.state.user.id ||
          this.state.user.displayName === "vhs" ? (
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

  render() {
    return (
      <div className="main mb-3 animate players">
        <div className="row ml-2 mr-2">
          <div className="col">
            <h1>Player Pool</h1>
          </div>
          <div className="col-md-6 pr-0">
            {!this.state.serverData.playerPool.find(
              n => n.id === this.state.user.id
            ) &&
            !this.state.serverData.team1.find(
              n => n.id === this.state.user.id
            ) &&
            !this.state.serverData.team2.find(
              n => n.id === this.state.user.id
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
                <div className="playerList">{this.generatePlayerPool()}</div>
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
    );
  }
}

export default PlayerPool;
