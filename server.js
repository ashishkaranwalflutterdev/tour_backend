const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {}; // Store connected users
let tours = {}; // Store visitors for each tour

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('register', (userId) => {
        users[userId] = socket.id;
        console.log('User registered:', userId);
    });

    socket.on('joinTour', (data) => {
        const { tourId, userId } = data;
        if (!tours[tourId]) {
            tours[tourId] = [];
        }
        if (!tours[tourId].includes(userId)) {
            tours[tourId].push(userId);
        }
        console.log(`User ${userId} joined tour ${tourId}`);
        console.log(`Current visitors for tour ${tourId}: ${tours[tourId].length}`);
        
        // Notify the guide and all visitors about the new visitor count
        tours[tourId].forEach(visitorId => {
            if (users[visitorId]) {
                io.to(users[visitorId]).emit('visitorUpdate', { tourId: tourId, visitors: tours[tourId].length });
            }
        });
    });

    socket.on('leaveTour', (data) => {
        const { tourId, userId } = data;
        if (tours[tourId]) {
            tours[tourId] = tours[tourId].filter(id => id !== userId);
            console.log(`User ${userId} left tour ${tourId}`);
            console.log(`Current visitors for tour ${tourId}: ${tours[tourId].length}`);

            // Notify the guide and all visitors about the updated visitor count
            tours[tourId].forEach(visitorId => {
                if (users[visitorId]) {
                    io.to(users[visitorId]).emit('visitorUpdate', { tourId: tourId, visitors: tours[tourId].length });
                }
            });
        }
    });

    socket.on('offer', (data) => {
        const targetSocketId = users[data.target];
        if (targetSocketId) {
            socket.to(targetSocketId).emit('offer', {
                sdp: data.sdp,
                type: data.type,
                from: data.from,
            });
        }
    });

    socket.on('answer', (data) => {
        const targetSocketId = users[data.target];
        if (targetSocketId) {
            socket.to(targetSocketId).emit('answer', {
                sdp: data.sdp,
                type: data.type,
                from: data.from,
            });
        }
    });

    socket.on('candidate', (data) => {
        const targetSocketId = users[data.target];
        if (targetSocketId) {
            socket.to(targetSocketId).emit('candidate', {
                candidate: data.candidate,
                sdpMid: data.sdpMid,
                sdpMLineIndex: data.sdpMLineIndex,
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let userId in users) {
            if (users[userId] === socket.id) {
                // Remove user from any tours they were part of
                for (let tourId in tours) {
                    tours[tourId] = tours[tourId].filter(id => id !== userId);
                    tours[tourId].forEach(visitorId => {
                        if (users[visitorId]) {
                            io.to(users[visitorId]).emit('visitorUpdate', { tourId: tourId, visitors: tours[tourId].length });
                        }
                    });
                }
                delete users[userId];
                break;
            }
        }
    });
});

server.listen(3000, () => {
    console.log('Listening on *:3000');
});
