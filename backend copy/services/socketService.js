/**
 * socketService.js
 * ----------------
 * Central Socket.IO service for LABES.
 * - Initialised once with an http.Server in server.js
 * - Every other module calls  getIo()  to emit events
 *
 * Events emitted by this backend:
 *   machine:created         { machine }
 *   machine:updated         { machine }
 *   machine:deleted         { machineId }
 *   machine:health-updated  { machineId, health, machine }
 *   safety:event            { event }
 *   alert:created           { alert }
 *   alert:updated           { alert }
 *   dashboard:updated       (no payload – tells clients to refetch summary)
 */

const { Server } = require('socket.io');

/** @type {import('socket.io').Server | null} */
let io = null;

/**
 * Initialise the Socket.IO server and attach it to the given http.Server.
 * Call this once from server.js BEFORE startServer().
 *
 * @param {import('http').Server} httpServer
 * @param {object} [opts] – extra Socket.IO options (e.g. cors)
 * @returns {import('socket.io').Server}
 */
function initSocketServer(httpServer, opts = {}) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    ...opts,
  });

  io.on('connection', (socket) => {
    console.log(`[socket] client connected  id=${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] client disconnected id=${socket.id} reason=${reason}`);
    });
  });

  return io;
}

/**
 * Returns the current Socket.IO server instance.
 * Returns null when called before initSocketServer (e.g. in unit tests).
 *
 * @returns {import('socket.io').Server | null}
 */
function getIo() {
  return io;
}

/**
 * Convenience helper – emit only when io is ready.
 *
 * @param {string} event
 * @param {unknown} [payload]
 */
function emit(event, payload) {
  if (io) {
    io.emit(event, payload);
  }
}

module.exports = { emit, getIo, initSocketServer };
