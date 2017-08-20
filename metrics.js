
const probe = require('pmx').probe();

module.exports.init = () => {

    global.metrics = {

        guilds: probe.counter({
            name: 'guilds'
        }),

        games: probe.counter({
            name: 'games'
        })

    };

    for(let i = 0; i < global.bot.guilds.size; i++)
        global.metrics.guilds.inc();

};