const path = require('path');
const http = require('http');
const express = require('express');

const lessMiddleware = require('less-middleware');

exports.init = () => {

    const app = express();

    app.use(lessMiddleware(path.join(__dirname, "public")));
    app.use(express.static(path.join(__dirname, "/public")));
    app.set('view engine', 'pug');

    http.createServer(app).listen(global.config.web.port, () => {

        app.all('*', (req, res) => res.render(
            path.join(__dirname, 'views/index.pug'),
            { bot_id: global.config.bot.id })
        );

    });

};