// src/sockets/index.js
const roomHandlers = require("./roomHandlers");
const systemHandlers = require("./systemHandlers");
const gameHandlers = require("./gameHandlers");

function registerSockets(io) {
  io.on("connection", (socket) => {
    systemHandlers(io, socket);
    roomHandlers(io, socket);
    gameHandlers(io, socket); // 지금은 비어있어도 됨
  });
}

module.exports = { registerSockets };
