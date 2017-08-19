
module.exports = () => {

    global.bot.user.setGame('Connect Four')
        .catch(console.error);

};