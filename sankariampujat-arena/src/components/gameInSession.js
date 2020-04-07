import React from "react";

class GameInSession extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: this.props.status,
      user: this.props.user
    };
  }

  parentCallback() {
    this.props.parentCallback("INIT");
  }

  render() {
    return (
      <div className="main">
        <div className="row animate">
          <div className="col text-center">
            <h2 className="session">Game in is session...</h2>
          </div>
        </div>
        {this.state.status === "FINISHED" ? (
          <div className="row">
            <div className="col justify-content-center">
              <button
                onClick={() => this.parentCallback()}
                className="btn btn-primary"
              >
                Start New Game!
              </button>
            </div>
          </div>
        ) : (
          <div className="row">
            <div className="row text-center">
              <h4>connect suomi6.net9.fi:27025; password sankariarena</h4>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default GameInSession;
