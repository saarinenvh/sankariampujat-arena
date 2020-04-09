import React from "react";

class GameInSession extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: this.props.status,
      user: this.props.user
    };
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ status: "ONGOING" });
    }, 30000);
  }

  parentCallback() {
    this.props.parentCallback("INIT");
  }

  render() {
    return (
      <div className="main">
        {this.state.status === "FINISHED" ? (
          <div>
            <div className="row">
              <div className="col text-center">
                <h2 className="session">Game Finished!</h2>
              </div>
            </div>
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
          </div>
        ) : (
          <div className="gameinsession">
            {this.state.status === "STARTING" ? (
              <div className="row animate">
                <div className="col text-center">
                  <h2 className="session">Configuring server...</h2>
                </div>
              </div>
            ) : (
              <div>
                <div className="row animate">
                  <div className="col text-center">
                    <h2 className="session">Game Started!</h2>
                  </div>
                </div>
                <div className="row">
                  <div className="col text-center mt-3">
                    <h5>connect suomi6.net9.fi:27025; password sankariarena</h5>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default GameInSession;
