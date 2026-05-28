const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { getSubClient } = require('../config/redis');

// Keep track of active online users: Map<userId, socketId>
const onlineUsers = new Map();

const initSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication Middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyformydashboard');
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Token validation failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    onlineUsers.set(userId, socket.id);
    
    console.log(`User connected: ${userId} (Socket: ${socket.id})`);

    // Broadcast online status to all users
    io.emit('userStatusChange', { userId, status: 'online' });

    // Send the list of current online users to the newly connected socket
    socket.emit('onlineUsersList', Array.from(onlineUsers.keys()));

    // 1. Listen for private chat messages
    socket.on('sendMessage', async ({ receiverId, content }) => {
      try {
        if (!content || !receiverId) return;

        // Save message to database
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          content,
        });

        const populatedMessage = await message.populate('sender', 'username profilePic');

        // Check if receiver is online and deliver message
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveMessage', populatedMessage);
        }

        // Echo back to sender for self updates
        socket.emit('messageSent', populatedMessage);

        // Optional: Also trigger a quiet bell notification for new message
        const notification = await Notification.create({
          receiver: receiverId,
          sender: userId,
          type: 'message',
        });
        const populatedNotification = await notification.populate('sender', 'username profilePic');

        // Deliver notification
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveNotification', populatedNotification);
        }
      } catch (error) {
        console.error('Socket message error:', error.message);
      }
    });

    // 2. Listen for typing status indicators
    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typingStatus', {
          senderId: userId,
          isTyping,
        });
      }
    });

    // 3. Handle Disconnection
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log(`User disconnected: ${userId} (Socket: ${socket.id})`);
      
      // Broadcast offline status
      io.emit('userStatusChange', { userId, status: 'offline' });
    });
  });

  // Setup Redis Pub/Sub notification subscriber listener
  const subClient = getSubClient();
  if (subClient) {
    subClient.subscribe('notifications', (message) => {
      try {
        const notification = JSON.parse(message);
        const receiverId = notification.receiver;

        // Locate receiver socket and deliver the notification in real-time
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receiveNotification', notification);
        }
      } catch (err) {
        console.error('Error handling Redis notification message:', err.message);
      }
    });
    console.log('[Redis Pub/Sub Subscriber] Listening for notifications channel events.');
  }

  return io;
};

const getOnlineUsers = () => onlineUsers;

module.exports = { initSocket, getOnlineUsers };
