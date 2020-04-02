import React from "react";
import HandleTeams from "./components/handleTeams";
import "./App.css";

function App() {
  return (
    <div className="App container">
      <div className="row">
        <div className="col-md-6 justify-content-center">
          <h1 id="header">SankariArena</h1>
        </div>
      </div>
      <HandleTeams></HandleTeams>
    </div>
  );
}

export default App;
