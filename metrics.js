
const probe = require('pmx').probe();

module.exports.init = () => {

    global.metric_guilds = probe.counter({
        name: 'guilds',
        value: global.bot.guilds.size
    });

};