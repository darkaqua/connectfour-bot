
module.exports = (message) => {

    if(!message.guild) return;

    if(message.author.bot) return;

    message.reply('test');

};