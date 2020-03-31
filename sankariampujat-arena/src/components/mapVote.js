import React from "react";
import dust2 from '../files/dust2.jpg'
import inferno from '../files/inferno.jpg'
import cache from '../files/cache.jpg'
import train from '../files/train.png'
import overpass from '../files/overpass.png'
import nuke from '../files/nuke.jpg'
import vertigo from '../files/vertigo.jpg'



class MapVote extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      votes: this.props.votes
    };
  }

  componentDidMount() {
    window.localStorage.clear()
  }

  postToBackEndApi = async (url, body) => {
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    this.setState({votes: data}, () => {console.log(this.state)});
}

  handleVote(map) {
    const newState = this.state.votes
    if (!Object.keys(window.localStorage).includes("mapVote")) {

      newState[map] = newState[map] + 1
      window.localStorage.setItem('mapVote', map)
      this.setState({votes: newState})
      console.log(window.localStorage)
    } else {
      newState[window.localStorage.getItem('mapVote')] = newState[window.localStorage.getItem('mapVote')] - 1
      newState[map] = newState[map] + 1
      window.localStorage.removeItem('mapVote')
      window.localStorage.setItem('mapVote', map)
    }

    this.postToBackEndApi("/api/updateVotes", newState)
  }

  async clearVotes() {
    const newState = this.state.votes
    const keys = Object.keys(newState)
    keys.forEach(n => newState[n] = 0)
    this.postToBackEndApi("/api/updateVotes", newState)
  }

  render() {
    return (
      <div className="mapVote mt-3">
        <div className="row mb-3">
          <div className="col">
            <h1>Map Vote</h1>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3 justify-content-center text-center mb-3">
            <h5>Dust2</h5>
            <img onClick={() => this.handleVote('dust2')} className="mapThumbnail" src={dust2} height="150" width="150" alt="Dust2"></img>
            <h5 className="mt-1">Votes: {this.state.votes.dust2}</h5>
          </div>
          <div className="col-md-3 justify-content-center text-center">
            <h5 >Inferno</h5>
            <img onClick={() => this.handleVote('inferno')}className="mapThumbnail" src={inferno} height="150" width="150" alt="Inferno"></img>
            <h5 className="mt-1">Votes: {this.state.votes.inferno}</h5>
          </div>
          <div className="col-md-3 justify-content-center text-center">
            <h5 >Cache</h5>
            <img onClick={() => this.handleVote('cache')}className="mapThumbnail" src={cache} height="150" width="150" alt="Cache"></img>
            <h5 className="mt-1">Votes: {this.state.votes.cache}</h5>
            </div>
          <div className="col-md-3 justify-content-center text-center">
            <h5 >Train</h5>
            <img onClick={() => this.handleVote('train')}className="mapThumbnail" src={train} height="150" width="150" alt="Train"></img>
            <h5 className="mt-1">Votes: {this.state.votes.train}</h5>
            </div>
          <div className="col-md-3 justify-content-center text-center">
            <h5 >Overpass</h5>
            <img onClick={() => this.handleVote('overpass')}className="mapThumbnail" src={overpass} height="150" width="150" alt="Overpass"></img>
            <h5 className="mt-1">Votes: {this.state.votes.overpass}</h5>
            </div>
          <div className="col-md-3 justify-content-center text-center">
            <h5 >Nuke</h5>
            <img onClick={() => this.handleVote('nuke')}className="mapThumbnail" src={nuke} height="150" width="150" alt="Nuke"></img>
            <h5 className="mt-1">Votes: {this.state.votes.nuke}</h5>
            </div>
          <div className="col-md-3 justify-content-center text-center">
            <h5>Vertigo</h5>
            <img onClick={() => this.handleVote('vertigo')}className="mapThumbnail" src={vertigo} height="150" width="150" alt="Vertigo"></img>
            <h5 className="mt-1">Votes: {this.state.votes.vertigo}</h5>
            </div>
        </div>
        <div className="row mt-2">
          <div className="col">
            <button
              className="btn btn-primary float-right"
              onClick={() => {
                this.clearVotes();
              }}
            >
              Clear votes
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default MapVote;
