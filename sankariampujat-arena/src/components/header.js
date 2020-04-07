import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: undefined
    };
  }

  componentDidMount() {
    this.checkIfAuthenticated();
  }

  async checkIfAuthenticated() {
    let user = await this.getFromBackEndAPI("/api/validateSession");
    this.setState(user);
  }

  async signOut() {
    await this.getFromBackEndAPI("/api/logout");
    this.setState({ user: undefined });
  }

  getFromBackEndAPI = async url => {
    const response = await fetch(url);
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message);
    }
    return body;
  };

  render() {
    return (
      <div className="row animate">
        <div className="col-md-6">
          <h1 id="header">SankariArena</h1>
        </div>
        {this.state.user !== undefined ? (
          <div className="col-md-6  p-2">
            <h3 className="usertext float-right mr-2">
              Hi {this.state.user.displayName}!
              <span className="ml-2">
                <FontAwesomeIcon
                  className="signOut"
                  onClick={() => this.signOut()}
                  icon={faSignOutAlt}
                ></FontAwesomeIcon>
              </span>
            </h3>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    );
  }
}

export default Header;
