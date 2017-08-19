const manager = require('../gameManager');

module.exports = (message) => {

    if(!message.guild) return;
    if(message.author.bot) return;

    if(message.content.startsWith(global.config.bot.prefix + "play")) {
        if(message.mentions.users.size !== 2) {
            message.reply("You have to specify exactly two players.");
        } else {
            manager.startNewGame(message);
        }
    }

};