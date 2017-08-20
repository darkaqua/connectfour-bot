//@ts-check
const width = 7;
const height = 6;

const EMPTY = 0;
const WIN = 3;

const Message = require('discord.js').Message;
const MessageReaction = require('discord.js').MessageReaction;
const User = require('discord.js').User;

const numberEmojis = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣"];
const circleEmojis = [":white_circle:", ":red_circle:", ":large_blue_circle:", ":green_heart:"];

function playerToEmoji(player) {
    return circleEmojis[player];
}

function columnToEmoji(column) {
    return numberEmojis[column];
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

    /**
     * Returns if the table is full of chips.
     * @return {boolean} table is full
     */
    isFull() {
        /* Just check top line because
            there is a thing called gravity. */
        for(let i = 0; i < width; i++)
            if(this.fields[i] === EMPTY)
                return false;
        return true;
    }

    winner() {
        
        let i, x, y;
        let player = 0, count = 0;

        const check = (n) => {
            if(this.fields[n] === EMPTY) {
                player = count = 0;
            } else if(player === this.fields[n]) {
                count++;
            } else if(player !== this.fields[n]) {
                player = this.fields[n];
                count = 1;
            }
            return count >= 4;
        }

        const mark = (info) => {
            for(let i = 0; i < 4; i++) {
                let x = info.x + info.xstep * i;
                let y = info.y + info.ystep * i;
                this.fields[y * width + x] = WIN;
            }
        }

        //Horizontal
        for(y = 0; y < height; y++ ){
            for(x = 0; x < width; x++) {
                if(check(y * width + x)) {
                    mark({ x: x, y: y, xstep: -1, ystep: 0 })
                    return player;
                }
            }
            count = 0;
        }

        //Vertical
        for(x = 0; x < width; x++) {
            for(y = 0; y < height; y++ ){
                if(check(y * width + x)) {
                    mark({ x: x, y: y, xstep: 0, ystep: -1 });
                    return player;
                }
            }
            count = 0;
        }

        //Diagonals        
        //Topleft -> bottomright
        //Starting at (1, 0), (2, 0) and (3, 0) (green)
        for(i = 1; i <= width - 4; i++) {
            for(x = i, y = 0; x < width; x++, y++) {
                if(check(y * width + x)) {
                    mark({ x: x, y: y, xstep: -1, ystep: -1 });
                    return player;
                }
            }
            count = 0;
        }

        //Starting at (0, 0), (0, 1) and (0, 2) (black)
        for(i = 0; i <= height - 4; i++) {
            for(x = 0, y = i; y < height; x++, y++) {
                if(check(y * width + x)) {
                    mark({ x: x, y: y, xstep: -1, ystep: -1 });
                    return player;
                }
            }
            count = 0;
        }

        //Topright -> bottomleft
        //Starting at (w-2, 0), (w-3, 0) and (w-4, 0) (green)
        for(i = width - 2; i > 2; i--) {
            for(x = i, y = 0; x >= 0; x--, y++) {
                if(check(y * width + x)) {
                    mark({ x: x, y: y, xstep: 1, ystep: -1 });
                    return player;
                }
            }
            count = 0;
        }

        //Starting at (w-1, 0), (w-1, 1) and (w-1, 2) (black)
        for(i = 0; i <= height - 4; i++) {
            for(x = width - 1, y = i; y < height; x--, y++) {
                if(check(y * width + x)) {
                    mark({ x: x, y: y, xstep: 1, ystep: -1 });
                    return player;
                }
            }
            count = 0;
        }

        return false;

    }

    /**
     * Converts the message to a string of emojis.
     * @return {string} table as string
     */
    toMessage() {
        return this.fields.map(playerToEmoji).join("").replace(/(:\w+:){7}/g, m => m + "\n");
        //return this.fields.map(v => `:${v}:`).join("").replace(/(:\d:){7}/g, m => m + "\n");
    }

}

/**
 * @class
 * @property { GameTable } table
 * @property { Message } message
 */
class Game {

    /**
     * @param { Message } message
     */
    constructor(message) {
        this.table = new GameTable();
        this.players = Array.from([message.author, message.mentions.users.first()]);
        this.currentTurn = Math.round(Math.random()) + 1;
        /** @this Game */
        message.channel.send(this.buildMessage()).then(m => {
            /** @type { Message } */
            this.message = m.constructor === Array ? m[0] : m;
            this.reactionCollector = this.message.createReactionCollector(
                /** 
                 * Emoji filter
                 * @param { MessageReaction } reaction
                 * @param { User } user
                 */
                (reaction, user) => {
                    //@ts-ignore
                    if(user.id === global.bot.user.id)
                        return false;
                    const validEmoji = numberEmojis.indexOf(reaction.emoji.toString()) >= 0;
                    const validUser = user.id === this.player(this.currentTurn).id;
                    if(validEmoji && validUser)
                        return true;
                    reaction.remove(user).catch(e => {
                        if(e.code === 50013 && !this.permissionsAlerted) {
                            this.permissionsAlerted = true;
                            this.message.channel.send("My powers are weak, I'm going to need the `Manage Messages` permission.");
                        }
                    });
                    return false;
                }
            );
            this.reactionCollector.on('collect', this.onReaction);
            this.react();
        });
        //Bind `this` to onReaction function
        this.onReaction = this.onReaction.bind(this);
    }

    /**
     * DO NOT CALL
     * Event listener for reactions.
     * @param { MessageReaction } reaction
     */
    onReaction(reaction) {
        //Column user selected
        const num = numberEmojis.indexOf(reaction.emoji.toString());
        //Remove the reaction the user just added.
        reaction.remove(this.player(this.currentTurn)).catch(console.error);
        if(this.table.columnAvailable(num)) {
            this.table.drop(num, this.currentTurn);
        } else {
            //That column is full, you can't drop a chip there.
            return;
        }
        reaction.remove(this.player(this.currentTurn)).catch(e => {
            if(e.code === 50013 && !this.permissionsAlerted) {
                this.permissionsAlerted = true;
                this.message.channel.send("My powers are weak, I'm going to need the `Manage Messages` permission.");
            }
        });
        const winner = this.table.winner();
        if(winner) {
            //There is a winner
            this.stop();
            this.apply(`Game Over! ${this.player(winner)} won!`);
        } else if(this.table.isFull()) {
            //Table is full but no winner, it's a tie
            this.stop();
            this.apply(`Game Over! It's a tie, nobody wins.`);
        } else {
            //Nothing special, next turn
            this.nextTurn();
        }
    }

    /**
     * @deprecated
     * Removes number reactions for the columns that have no more space.
     */
    updateReactions() {
        this.message.reactions.filter(reaction => {
            return !this.table.columnAvailable(numberEmojis.indexOf(reaction.emoji.toString()))
        }).forEach(reaction => reaction.remove());
    }

    /**
     * Swaps the player and applies changes.
     */
    nextTurn() {
        this.currentTurn = this.currentTurn === 1 ? 2 : 1;
        this.apply();
    }

    /**
     * Reacts with the passed number's emoji (adding one).
     * Recursive to avoid disordered reactions.
     * @param {number} [num] 
     */
    react(num) {
        num = num || 0;
        if(num > 6) return;
        //If column has no space, skip it.
        if(!this.table.columnAvailable(num)) this.react(num + 1);
        this.message.react(columnToEmoji(num))
            .then(_ => {
                //Recursive call
                this.react(num + 1)
            })
            .catch(e => console.error(`Reaction error ${num}: ${e.message}`));
    }

    /**
     * Creates the message from the stored data.
     * @returns {string} the message
     */
    buildMessage(message) {
        return [
            `${playerToEmoji(1)} ${this.player(1)} - ${this.player(2)} ${playerToEmoji(2)}\n\n`,
            this.table.toMessage(),
            [0, 1, 2, 3, 4, 5, 6].map(columnToEmoji).join("") + "\n\n",
            message || `${this.player(this.currentTurn)} it's your turn!`
        ].join("");
    }

    /**
     * Returns the user object from the player number
     * @param {number} num 
     */
    player(num) {
        return this.players[num - 1];
    }

    /**
     * Edits the message with the updated table.
     */
    apply(message) {
        this.message.edit(this.buildMessage(message)).catch(console.error);
    }

    /**
     * Ends the game.
     */
    stop(){
        this.message.clearReactions().catch(console.error);
        if(this.reactionCollector)
            this.reactionCollector.stop();
    }

}


module.exports = {
    Game: Game,
    GameTable: GameTable
};