
global.config = require('./config.json');

require('./bot/bot').init();
require('./web/web').init();