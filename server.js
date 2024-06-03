const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

// Store connected users
let connectedUsers = [];

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Add new user to the connected users list
  connectedUsers.push(socket.id);

  // Notify the user about their connection
  socket.emit('welcome', 'Welcome to the stranger chat!');

  // Handle chat messages
  socket.on('sendMessage', (message) => {
    const recipient = connectedUsers.find((id) => id !== socket.id);
    if (recipient) {
      io.to(recipient).emit('receiveMessage', message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedUsers = connectedUsers.filter((id) => id !== socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

server.listen(port, () => console.log(`Server is running on port ${port}`));
