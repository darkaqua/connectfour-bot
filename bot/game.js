//@ts-check
const width = 7;
const height = 6;

const EMPTY = 0;
const WIN = 3;

const Message = require('discord.js').Message;
const MessageReaction = require('discord.js').MessageReaction;
const User = require('discord.js').User;

const inviteEmojis = ['✅', '❎'];
const numberEmojis = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣", "7⃣"];
const circleEmojis = [":white_circle:", ":red_circle:", ":large_blue_circle:", ":green_heart:"];

function playerToEmoji(player) {
    return circleEmojis[player];
}

function columnToEmoji(column) {
    return numberEmojis[column];
}

function reactionCatchError(e) {
    if(e.code === 50013 && !this.permissionsAlerted) {
        this.permissionsAlerted = true;
        this.message.channel.send("My powers are weak, I'm going to need the `Manage Messages` permission.");
    }
}


function validateUserReactionCollector(reaction, user, emoji_list, player_id) {
    //@ts-ignore
    if(user.id === global.bot.user.id)
        return false;

    const validEmoji = emoji_list.indexOf(reaction.emoji.toString()) >= 0;
    const validUser = user.id === player_id;
    if(validEmoji && validUser)
        return true;
    reaction.remove(user).catch(reactionCatchError);
    return false;
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
        this.lastThrow = -1;
        this.players = Array.from([message.author, message.mentions.users.first()]);

        this.invite(message);
    }

    /**
     * Makes the invitation to the requested user.
     */
    invite(message){
        message.channel.send(this.buildInvitationMessage()).then(m => {
            /** @type { Message } */
            this.message = m.constructor === Array ? m[0] : m;
            this.reactionCollector = this.message.createReactionCollector((reaction, user) => {
                    return validateUserReactionCollector(reaction, user, inviteEmojis, this.player(2).id);
                });
            this.reactionCollector.on('collect', this.onInviteReaction);
            this.react_invitation();
        });
        //Bind `this` to onInviteReaction function
        this.onInviteReaction = this.onInviteReaction.bind(this);
    }

    /**
     * Starts the game.
     */
    start(){
        this.started = true;
        global.metrics.games.inc();
        this.currentTurn = Math.round(Math.random()) + 1;
        /** @this Game */
        this.message.edit(this.buildMessage()).then(_ => {
            this.reactionCollector = this.message.createReactionCollector((reaction, user) => {
                return validateUserReactionCollector(reaction, user, numberEmojis, this.player(this.currentTurn).id);
            });
            this.reactionCollector.on('collect', this.onGameReaction);
            this.react_numbers();
        });
        //Bind `this` to onGameReaction function
        this.onGameReaction = this.onGameReaction.bind(this);
    }

    /**
     * DO NOT CALL
     * Event listener for invite reactions.
     * @param { MessageReaction } reaction
     */
    onInviteReaction(reaction) {
        //Column user selected
        const num = inviteEmojis.indexOf(reaction.emoji.toString());

        if(num === 0){
            this.message.clearReactions().catch(console.error);
            this.start();
            return;
        }
        this.stop();
    }

    /**
     * DO NOT CALL
     * Event listener for game reactions.
     * @param { MessageReaction } reaction
     */
    onGameReaction(reaction) {
        //Column user selected
        const num = numberEmojis.indexOf(reaction.emoji.toString());
        //Remove the reaction the user just added.
        reaction.remove(this.player(this.currentTurn)).catch(console.error);
        //That column is full, you can't drop a chip there.
        if(!this.table.columnAvailable(num))
            return;
        this.table.drop(num, this.currentTurn);
        this.lastThrow = num;
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
     * Reacts with the invitation emojis.
     */
    react_invitation(){
        this.message.react(inviteEmojis[0]).then(_ =>
            this.message.react(inviteEmojis[1])
                .catch(console.error)
        ).catch(console.error);
    }
    /**
     * Reacts with the passed number's emoji (adding one).
     * Recursive to avoid disordered reactions.
     * @param {number} [num] 
     */
    react_numbers(num) {
        num = num || 0;
        if(num > 6) return;
        //If column has no space, skip it.
        if(!this.table.columnAvailable(num)) this.react_numbers(num + 1);
        this.message.react(columnToEmoji(num))
            .then(_ => {
                //Recursive call
                this.react_numbers(num + 1)
            })
            .catch(e => console.error(`Reaction error ${num}: ${e.message}`));
    }

    buildInvitationMessage(){
        return `${this.player(1)} wants to play with you ${this.player(2)}, you accept the challenge?`;
    }

    /**
     * Creates the message from the stored data.
     * @returns {string} the message
     */
    buildMessage(message) {
        let numbers = [0, 1, 2, 3, 4, 5, 6].map(columnToEmoji);
        if(this.lastThrow >= 0) numbers.splice(this.lastThrow, 1, ":arrow_up:");
        return [
            `${playerToEmoji(1)} ${this.player(1)} - ${this.player(2)} ${playerToEmoji(2)}\n\n`,
            this.table.toMessage(),
            numbers.join("") + "\n\n",
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
        if(this.stopped) return;
        this.message.clearReactions().catch(_ => _);
        if(this.started){
            global.metrics.games.dec();
        } else {
            this.message.delete(0).catch(console.error);
        }
        if(this.reactionCollector)
            this.reactionCollector.stop();
        this.stopped = true;
    }

}


module.exports = {
    Game: Game,
    GameTable: GameTable
};