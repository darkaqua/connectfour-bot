
global.config = require('./config.json');

require('./bot/bot').init().then(() => {

    require('./metrics').init();
    require('./web/web').init();

}).catch(console.error);