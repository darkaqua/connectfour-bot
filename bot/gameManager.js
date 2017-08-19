const Game = require('./game').Game;

class GameManager {

    constructor() {
        this.games = [];
    }

    startNewGame(message) {
        this.games.push(new Game(message));
    }

}

module.exports = new GameManager();