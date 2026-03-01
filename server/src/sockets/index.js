// src/sockets/index.js
const roomHandlers = require("./roomHandlers");
const systemHandlers = require("./systemHandlers");
const gameHandlers = require("./gameHandlers");
const chatHandlers = require("./chatHandlers");

function registerSockets(io) {
  io.on("connection", (socket) => {
    systemHandlers(io, socket);
    roomHandlers(io, socket);
    gameHandlers(io, socket);
    chatHandlers(io, socket);
  });
}

module.exports = { registerSockets };
