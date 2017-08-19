const width = 7;
const height = 6;

const EMPTY = 0;

function playerToEmoji(player) {
    return [":white_circle:", ":red_circle:", ":large_blue_circle:"][player];
}

function columnToEmoji(column) {
    return ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣"][column];
}

/**
 * @class
 */
class GameTable {

    constructor() {
        this.fields = Array(width*height).fill(EMPTY);
    }

    /**
     * Drops a chip onto the table
     * @param {number} column
     * @param {number} player
     */
    drop(column, player) {
        //Starts at 0 because we already made sure the column has available slots.
        let row = 0;
        while(this.fields[(row+1)*width + column] === EMPTY)
            row++;
        this.fields[row*width + column] = player;
    }

    get(row, column) {
        return this.fields[row*width + column];
    }

    /**
     * Returns true if there is at least one slot available for a chip.
     * @param {number} column 
     */
    columnAvailable(column) {
        return this.fields[column] === EMPTY;
    }

    /**
     * @return {Array.<number>} an array with the numbers of the columns that are available
     */
    availableColumns() {
        const available = [];
        for(let i = 0; i < width; i++)
            this.fields[i] === EMPTY && available.push(i);
        console.log(JSON.stringify(available));
        return available;
    }

    toMessage() {
        return this.fields.map(playerToEmoji).join("").replace(/(:\w+_circle:){7}/g, m => m + "\n");
        //return this.fields.map(v => `:${v}:`).join("").replace(/(:\d:){7}/g, m => m + "\n");
    }

}

/**
 * @class
 * @property { GameTable } table
 */
class Game {

    /**
     * @param { Object } message
     */
    constructor(message) {
        this.table = new GameTable();
        this.players = Array.from(message.mentions.users.values());
        this.currentTurn = 1;
        message.channel.send(this.buildMessage()).then(m => {
            this.message = m;
            this.react();
        });
    }

    react(num) {
        num = num || 0;
        if(num > 7) return;
        this.message.react(columnToEmoji(num)).then(_ => this.react(num + 1)).catch(e => console.error(`${num}: ${e.message}`));
    }

    /**
     * Creates the message from the stored data.
     * @returns {string} the message
     */
    buildMessage() {
        return [
            `${playerToEmoji(1)} ${this.player(1)} - ${this.player(2)} ${playerToEmoji(2)}\n\n`,
            this.table.toMessage(),
            [0, 1, 2, 3, 4, 5, 6].map(columnToEmoji).join("") + "\n\n",
            `${this.player(this.currentTurn)} it's your turn!`
        ].join("");
    }

    /**
     * Returns the user object from the player number
     * @param {number} num 
     */
    player(num) {
        return this.players[num - 1];
    }

    apply() {

    }

}


module.exports = {
    Game: Game,
    GameTable: GameTable
};