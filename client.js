const io = require('socket.io-client');

const socket = io.connect('http://localhost:3000');

// Log connection status
socket.on('connect', () => {
  console.log('Connected to server with id:', socket.id);

  // Emit a test event
  socket.emit('test-event', { message: 'Hello from client' });
  
  // Emit an audio-chunk event
  socket.emit('audio-chunk', { data: 'test-audio-data' });
});

// Log received events
socket.on('test-response', (data) => {
  console.log('Received test-response:', data);
});

socket.on('audio-chunk', (data) => {
  console.log('Received broadcast audio-chunk:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
