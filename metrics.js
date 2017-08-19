
const probe = require('pmx').probe();

module.exports.init = () => {

    global.metric_guilds = probe.counter({
        name: 'guilds'
    });

    for(let i = 0; i < global.bot.guilds.size; i++)
        metric_guilds.inc();

};