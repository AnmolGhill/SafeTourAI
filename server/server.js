const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initializeFirebase } = require('./config/firebase');
const { initializeBlockchain } = require('./config/blockchain');
const { initializeEmailTransporter } = require('./utils/sendEmail');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const blockchainRoutes = require('./routes/blockchainRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const kycRoutes = require('./routes/kyc');
const digitalIdRoutes = require('./routes/digitalId');

// Import middleware
const { rateLimiter } = require('./middleware/authMiddleware');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Global rate limiting
app.use(rateLimiter(1000, 15 * 60 * 1000)); // 1000 requests per 15 minutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SafeTourAI Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emergencies', emergencyRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/digital-id', digitalIdRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SafeTourAI API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      emergencies: '/api/emergencies',
      blockchain: '/api/blockchain',
      notifications: '/api/notifications',
      kyc: '/api/kyc',
      digitalId: '/api/digital-id'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SafeTourAI API Documentation',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/verify-otp': 'Verify email OTP',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/firebase-login': 'Login with Firebase',
        'POST /api/auth/resend-otp': 'Resend OTP',
        'POST /api/auth/logout': 'Logout user',
        'GET /api/auth/me': 'Get current user'
      },
      users: {
        'GET /api/users/:userId': 'Get user profile',
        'PUT /api/users/:userId': 'Update user profile',
        'PUT /api/users/:userId/location': 'Update user location',
        'GET /api/users/:userId/dashboard': 'Get user dashboard',
        'POST /api/users/:userId/emergency-contacts': 'Add emergency contact',
        'DELETE /api/users/:userId/emergency-contacts/:contactId': 'Remove emergency contact',
        'GET /api/users/nearby/users': 'Get nearby users',
        'GET /api/users/nearby/responders': 'Get nearby responders'
      },
      emergencies: {
        'POST /api/emergencies/create': 'Create emergency (SOS)',
        'GET /api/emergencies/user/:userId': 'Get user emergencies',
        'GET /api/emergencies/nearby': 'Get nearby emergencies',
        'GET /api/emergencies/:emergencyId': 'Get emergency details',
        'PUT /api/emergencies/:emergencyId/status': 'Update emergency status',
        'POST /api/emergencies/:emergencyId/assign-responder': 'Assign responder'
      },
      blockchain: {
        'POST /api/blockchain/transaction': 'Create blockchain transaction',
        'GET /api/blockchain/user/:userId': 'Get user transactions',
        'GET /api/blockchain/emergency/:emergencyId': 'Get emergency transactions',
        'GET /api/blockchain/hash/:hash': 'Get transaction by hash'
      },
      notifications: {
        'POST /api/notifications/firebase': 'Send Firebase notification',
        'POST /api/notifications/email': 'Send email notification',
        'POST /api/notifications/emergency-contacts': 'Notify emergency contacts',
        'POST /api/notifications/nearby-responders': 'Notify nearby responders'
      },
      kyc: {
        'POST /api/kyc/submit': 'Submit KYC information',
        'GET /api/kyc/status': 'Get KYC status',
        'GET /api/kyc/pending': 'Get pending KYC submissions (Admin)',
        'POST /api/kyc/verify/:userId': 'Verify KYC submission (Admin)',
        'GET /api/kyc/statistics': 'Get KYC statistics (Admin)'
      },
      digitalId: {
        'POST /api/digital-id/generate': 'Generate blockchain digital ID',
        'GET /api/digital-id/user/:userId': 'Get user digital ID',
        'GET /api/digital-id/verify/:digitalIdHash': 'Verify digital ID',
        'POST /api/digital-id/regenerate': 'Regenerate digital ID'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedPath: req.originalUrl,
    availableEndpoints: [
      '/api/auth',
      '/api/users',
      '/api/emergencies',
      '/api/blockchain',
      '/api/notifications',
      '/api/kyc',
      '/api/digital-id'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT error
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // JWT expired error
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Initialize services
const initializeServices = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    // Initialize Firebase
    initializeFirebase();
    console.log('✅ Firebase initialized successfully');

    // Initialize Blockchain
    initializeBlockchain();
    console.log('✅ Blockchain initialized successfully');

    // Initialize Email Transporter
    initializeEmailTransporter();
    console.log('✅ Email transporter initialized successfully');

    console.log('🚀 All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    await initializeServices();
    
    // Setup Socket.IO event handlers
    setupSocketHandlers(io);
    
    server.listen(PORT, () => {
      console.log(`
🌟 SafeTourAI Server Started Successfully!
📍 Environment: ${NODE_ENV}
🚀 Server running on port: ${PORT}
🌐 Local URL: http://localhost:${PORT}
📚 API Documentation: http://localhost:${PORT}/api/docs
💚 Health Check: http://localhost:${PORT}/health

🔧 Available Endpoints:
   • Authentication: http://localhost:${PORT}/api/auth
   • Users: http://localhost:${PORT}/api/users
   • Emergencies: http://localhost:${PORT}/api/emergencies
   • Blockchain: http://localhost:${PORT}/api/blockchain
   • Notifications: http://localhost:${PORT}/api/notifications
   • KYC: http://localhost:${PORT}/api/kyc

📱 Features Enabled:
   ✅ MongoDB Database
   ✅ Firebase Authentication & Notifications
   ✅ Blockchain Transaction Recording
   ✅ Email Notifications
   ✅ Real-time Emergency Alerts
   ✅ Location-based Services
   ✅ Role-based Access Control
   ✅ KYC & Blockchain Identity Verification
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Socket.IO event handlers
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    
    // Handle user joining location-based rooms
    socket.on('join_room', (data) => {
      socket.join(data.room);
      console.log(`👤 User ${socket.id} joined room: ${data.room}`);
    });
    
    // Handle user leaving rooms
    socket.on('leave_room', (data) => {
      socket.leave(data.room);
      console.log(`👤 User ${socket.id} left room: ${data.room}`);
    });
    
    // Handle user online status
    socket.on('user_online', (data) => {
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        status: 'online',
        timestamp: data.timestamp
      });
    });
    
    // Handle emergency alerts
    socket.on('emergency_created', (data) => {
      // Broadcast to nearby users and responders
      socket.broadcast.to(`location_${data.locationId}`).emit('emergency_alert', data);
    });
    
    // Handle responder updates
    socket.on('responder_update', (data) => {
      socket.broadcast.emit('responder_assigned', data);
    });
    
    // Handle emergency status updates
    socket.on('emergency_status_update', (data) => {
      socket.broadcast.emit('emergency_updated', data);
    });
    
    // Handle blockchain transaction updates
    socket.on('blockchain_transaction', (data) => {
      socket.broadcast.emit('blockchain_transaction', data);
    });
    
    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date()
      });
    });
  });
};

// Start the server
startServer();

module.exports = { app, io };
