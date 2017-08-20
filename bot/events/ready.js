
module.exports = () => {

    //Not working anymore(?)
    global.bot.user.setPresence({
        status: 'online',
        afk: false,
        game: {
            name: 'http://connectfour.darkaqua.net/',
            url: null,
            type: 0
        }
    }).catch(console.error);

};
