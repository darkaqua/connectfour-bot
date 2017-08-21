const Game = require('./game').Game;

class GameManager {

    constructor() {
        this.games = [];
    }

    startNewGame(message) {
        const game = new Game(message);
        this.games.push(game);

        setTimeout(() => {
            game.stop();
            this.games.splice(this.games.indexOf(game), 1);
        }, 1000 * 60 * 15);
    }

}

module.exports = new GameManager();