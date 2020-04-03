import React from "react";
// import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import HandleTeams from "./components/handleTeams";
import Header from "./components/header";
import "./App.css";

function App() {
  return (
    <div className="App container">
      <Header></Header>
      <HandleTeams></HandleTeams>
    </div>
  );
}

export default App;
