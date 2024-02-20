class voteHandler {
  votes: { [key: string]: string[] };
  constructor() {
    this.votes = {
      map1: [],
      map2: [],
      map3: [],
    };
  }

  voteForMap(map: string, user: string) {
    // if the user has already voted for this map, ignore
    if (this.votes[map].includes(user)) {
      return;
    }

    // remove the user's vote from the other maps
    for (const key in this.votes) {
      this.votes[key] = this.votes[key].filter((vote) => vote !== user);
    }

    this.votes[map].push(user);
  }
}

export default voteHandler;
