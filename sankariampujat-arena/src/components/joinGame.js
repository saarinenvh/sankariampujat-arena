import React from "react";

class JoinGame extends React.Component {
  render() {
    return (
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
    );
  }
}

export default JoinGame;
