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

let users = [];

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('register', ({ userId, interests }) => {
    users.push({ id: socket.id, userId, interests, socket });
    matchUser(socket);
  });

  socket.on('sendMessage', (message) => {
    const recipient = users.find((user) => user.socket === socket).match;
    if (recipient) {
      recipient.emit('receiveMessage', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    users = users.filter((user) => user.id !== socket.id);
  });
});

const matchUser = (socket) => {
  const currentUser = users.find((user) => user.socket === socket);
  const potentialMatches = users.filter((user) => {
    if (user.socket === socket || user.match) return false;
    return currentUser.interests.some((interest) => user.interests.includes(interest));
  });

  if (potentialMatches.length > 0) {
    const match = potentialMatches[0];
    currentUser.match = match.socket;
    match.match = socket;
    socket.emit('matched', { userId: match.userId, interests: match.interests });
    match.socket.emit('matched', { userId: currentUser.userId, interests: currentUser.interests });
  }
};

app.get('/', (req, res) => {
  res.send('Server is running');
});

server.listen(port, () => console.log(`Server is running on port ${port}`));
