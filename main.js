
global.config = require('./config.json');

require('./web/web').init();
require('./bot/bot').init().then(() => {

    require('./metrics').init();

}).catch(console.error);