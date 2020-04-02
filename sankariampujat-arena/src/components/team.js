import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

class Team extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      players: props.players
    };
  }

  removePlayerFromTeam(player) {
    this.props.parentCallback(player);
  }

  updateTeam(nextProps) {
    if (nextProps.players !== this.props.players) {
      this.setState({ players: nextProps.players });
    }
  }

  renderTeamList() {
    if (this.state.players.length > 0) {
      return this.state.players.map((n, i) => (
        <div className="row" key={i + n}>
          <div className="col">
            {n.displayName}{" "}
            <span
              className="link right"
              onClick={() => this.removePlayerFromTeam(n)}
            >
              <FontAwesomeIcon color="red" icon={faTimes} />
            </span>
          </div>
        </div>
      ));
    } else {
      return (
        <div className="row">
          <div className="col">
            <p>No players in this team.</p>
          </div>
        </div>
      );
    }
  }

  render() {
    return (
      <div className="card">
        <div className="card-body">
          <div className="teamList" key={this.state.players}>
            {this.renderTeamList()}
          </div>
        </div>
      </div>
    );
  }
}

export default Team;
