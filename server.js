const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

const rooms = {};

io.on('connection', (socket) => {
  console.log('A new client connected');

  // Create a room
  socket.on('create-room', (roomId) => {
    if (rooms[roomId]) {
      // If the room already exists, delete it first
      delete rooms[roomId];
      io.in(roomId).socketsLeave(roomId); // Disconnect all clients from the room
      console.log(`Room ${roomId} deleted to create a new one`);
    }
    rooms[roomId] = { host: socket.id, clients: [] };
    socket.join(roomId);
    io.emit('room-list', Object.keys(rooms)); // Notify all clients about the new room
    console.log(`Room ${roomId} created`);
  });

  // Delete a room
  socket.on('delete-room', (roomId) => {
    if (rooms[roomId] && rooms[roomId].host === socket.id) {
      delete rooms[roomId];
      io.in(roomId).socketsLeave(roomId); // Disconnect all clients from the room
      io.emit('room-list', Object.keys(rooms)); // Notify all clients about the deleted room
      console.log(`Room ${roomId} deleted`);
    }
  });

  // Join a room
  socket.on('join-room', (roomId) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      rooms[roomId].clients.push(socket.id);
      console.log(`Client joined room ${roomId}`);
      io.in(roomId).emit('user-joined', roomId);
    }
  });

  // Leave a room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    if (rooms[roomId]) {
      rooms[roomId].clients = rooms[roomId].clients.filter(id => id !== socket.id);
      if (rooms[roomId].clients.length === 0 && rooms[roomId].host === socket.id) {
        delete rooms[roomId];
        io.emit('room-list', Object.keys(rooms)); // Notify all clients about the deleted room
      }
    }
    console.log(`Client left room ${roomId}`);
  });

  // Broadcast audio within a room
  socket.on('audio-chunk', ({ roomId, data }) => {
    if (rooms[roomId]) {
      console.log(`Audio For Room ${roomId}`);
      socket.to(roomId).emit('audio-chunk', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
    for (let roomId in rooms) {
      if (rooms[roomId].host === socket.id) {
        delete rooms[roomId];
        io.to(roomId).emit('room-closed');
      } else {
        rooms[roomId].clients = rooms[roomId].clients.filter(id => id !== socket.id);
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});
