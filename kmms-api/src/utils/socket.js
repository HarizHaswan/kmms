// backend/src/utils/socket.js
let ioInstance = null;

function initIO(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    // optional: log
    console.log('Socket connected:', socket.id);

    // client should send auth token in handshake.auth.token
    // we will verify token and join them to a room with their userId
    const jwt = require('jsonwebtoken');
    const User = require('../config/models/User');
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        const userId = decoded.id || decoded._id;
        if (userId) {
          socket.join(userId.toString());
          socket.userId = userId;
        }
      }
    } catch (err) {
      // token invalid — keep connection but no room join
      console.warn('Socket auth failed', err?.message);
    }

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  ioInstance = io;
  return io;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized. Call initIO(server) first.');
  return ioInstance;
}

module.exports = { initIO, getIO };
