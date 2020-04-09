export const getFromBackEndAPI = async url => {
  const response = await fetch(url);
  const body = await response.json();

  if (response.status !== 200) {
    throw Error(body.message);
  }
  return body;
};

export const postToBackEndApi = async (url, body) => {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
  const response = await fetch(url, requestOptions);
  const data = await response.json();
  this.setState({ serverData: data }, () => {});
};

export function randomizeTeams() {
  // Empty teams and put them to playerPool
  const newState = JSON.parse(JSON.stringify(this.state.serverData));
  newState.playerPool = [];
  newState.team1 = [];
  newState.team2 = [];

  newState.playerPool = newState.playerPool.concat(this.state.serverData.team1);
  newState.playerPool = newState.playerPool.concat(this.state.serverData.team2);
  newState.playerPool = newState.playerPool.concat(
    this.state.serverData.playerPool
  );

  newState.playerPool = this.shuffleArray(newState.playerPool);
  newState.team1 = newState.playerPool.splice(
    0,
    Math.floor(newState.playerPool.length / 2)
  );
  newState.team2 = newState.playerPool;
  newState.playerPool = [];
  console.log(newState);
  this.postToBackEndApi("/api/updateState", newState);
}
