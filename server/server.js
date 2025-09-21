const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

// Firebase removed - using backend-only authentication
// const firebaseConfig = require('./config/firebase');
const logger = require('./utils/logger');
const { globalErrorHandler, AppError } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const requestTimeout = require('./middleware/requestTimeout');
const { sanitizeInputMiddleware } = require('./utils/validation');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const blockchainRoutes = require('./routes/blockchain');
const kycRoutes = require('./routes/kyc');
const emergencyRoutes = require('./routes/emergency');
const locationRoutes = require('./routes/location');
const notificationsRoutes = require('./routes/notifications');
const mapsRoutes = require('./routes/maps');
const weatherRoutes = require('./routes/weather');
const walletRoutes = require('./routes/wallet');
const geminiRoutes = require('./routes/gemini');
const userRoutes = require('./routes/user');
const digitalIdRoutes = require('./routes/digitalId');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(compression());

// Request timeout middleware
app.use(requestTimeout(30000)); // 30 second timeout

// CORS configuration - allow all origins for development and production
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'https://safetourai.onrender.com',
      'https://safe-tour.onrender.com',
      'https://safetourai.vercel.app',
      'https://safe-tour.vercel.app'

    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }

  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Logging
app.use(morgan('combined', { stream: { write: message => console.log(message.trim()) } }));

// Body parsing middleware with error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new AppError('Invalid JSON format', 400, 'INVALID_JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInputMiddleware);

// Health check endpoint with enhanced monitoring
app.get('/health', (req, res) => {
  try {
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      version: process.version,
      platform: process.platform
    };
    
    res.status(200).json(healthData);
    console.log('Health check accessed', { ip: req.ip });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed'
    });
  }
});

// Root route for deployment health checks
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'SafeTourAI Backend API',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/user', userRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/digital-id', digitalIdRoutes);

// 404 handler
app.use('*', (req, res, next) => {
  const error = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404,
    'ROUTE_NOT_FOUND',
    { path: req.originalUrl, method: req.method }
  );
  next(error);
});

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown handling
const server = app.listen(PORT, () => {
  console.log('\n🚀 ========== SAFETOURAI SERVER ==========');
  console.log('🌐 Server: http://localhost:5000');
  console.log('🔗 Frontend: http://localhost:3000');
  console.log('🌍 Environment: development');
  
  console.log('\n🔐 ========== AUTHENTICATION ==========');
  console.log('✅ Firebase Admin SDK');
  console.log('✅ Email Service');
  console.log('✅ JWT Authentication');
  
  console.log('\n⛓️  ========== BLOCKCHAIN ==========');
  console.log('🌐 Network: Ethereum Mainnet');
  console.log('🔐 Wallet: HD Deterministic (BIP39)');
  console.log('💎 Tokens: ETH + ERC-20');
  console.log('🚀 Provider: Infura Production');
  
  console.log('\n🤖 ========== GEMINI AI ==========');
  if (process.env.GEMINI_API_KEY) {
    console.log('✅ Gemini API Key: Configured');
    console.log('🧠 AI Model: gemini-pro');
    console.log('🛡️ SafeTourAI Assistant: Ready');
    console.log('📍 Endpoints: /api/gemini/chat, /api/gemini/health');
  } else {
    console.log('❌ Gemini API Key: Not configured');
    console.log('⚠️  Add GEMINI_API_KEY to .env file');
    console.log('📖 See GEMINI_SETUP.md for instructions');
  }
  
  console.log('\n✅ All services ready!\n');
});

// Handle server errors
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`❌ ${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`❌ ${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('🚨 UNHANDLED PROMISE REJECTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

module.exports = app;
