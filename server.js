const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

io.on('connection', (socket) => {
  console.log('A new client connected');

  socket.on('audio-chunk', (data) => {
    // Broadcast the audio chunk to all connected clients
    io.emit('audio-chunk', data);
    console.log('Received >>>> '+data);
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is listening on http://localhost:3000');
});
