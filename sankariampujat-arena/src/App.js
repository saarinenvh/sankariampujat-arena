import React from "react";
// import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import HandleTeams from "./components/handleTeams";
import "./App.css";

function App() {
  return (
    // <Router>
    //   <Switch>
    //     <Route exact path="/">
    <div className="App container">
      <div className="row">
        <div className="col-md-6 justify-content-center">
          <h1 id="header">SankariArena</h1>
        </div>
      </div>
      <HandleTeams></HandleTeams>
    </div>
    /* </Route>
        <Route path="/auth/steam/return">
          <Return></Return>
        </Route>
      </Switch>
    </Router> */
  );
}

export default App;
