const Discord = require("discord.js");
const fs = require("fs");
const path = require("path");

global.bot = new Discord.Client();

exports.init = () => {

    fs.readdirSync(path.join(__dirname, "events")).forEach((name) =>{
        global.bot.on(/(.+)\.js/i.exec(name)[1], require(`./events/${name}`));
    });

    return global.bot.login(global.config.bot.token);

};