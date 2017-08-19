
module.exports = () => {

    //Not working anymore(?)
    global.bot.user.setPresence({
        status: 'online',
        afk: false,
        game: {
            name: 'Connect Four',
            url: null,
            type: 0
        }
    }).catch(console.error);

};
