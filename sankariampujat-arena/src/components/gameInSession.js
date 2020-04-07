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
            {this.state.status === "FINISHED" ? (
              <button
                onClick={() => this.parentCallback()}
                className="btn btn-primary"
              >
                Start New Game!
              </button>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default GameInSession;
