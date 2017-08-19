const assert = require('assert');

const GameTable = require('./bot/game.js').GameTable;
const table = new GameTable();

table.drop(3, 1);
assert(table.get(5, 3) === 1, "Chip is not 1");

table.drop(3, 2);
assert(table.get(4, 3) === 2, "Chip is not 2");