const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { initRedis } = require('./config/redis');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads Folder Statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Connect to Database & Services
const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Connect to Redis (fails gracefully to local Mock)
  await initRedis();

  // Initialize Socket.IO
  const { initSocket } = require('./services/socketService');
  initSocket(server);

  // Import Routes
  const authRoutes = require('./routes/authRoutes');
  const userRoutes = require('./routes/userRoutes');
  const postRoutes = require('./routes/postRoutes');
  const chatRoutes = require('./routes/chatRoutes');
  const notificationRoutes = require('./routes/notificationRoutes');
  const analyticsRoutes = require('./routes/analyticsRoutes');

  // Mount Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Basic API Status Check Route
  app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Social Media Dashboard API is fully healthy!' });
  });

  // Start Server listening
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Fatal error starting application server:', error.message);
});
