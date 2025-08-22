const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const swaggerUi = require('swagger-ui-express');
const specs = require('./swagger'); // Assuming Swagger specs are defined here
const morgan = require('morgan');

const app = express();

// Check for required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    console.error(`${varName} is not defined in the environment variables`);
    process.exit(1);
  }
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend-domain.com'], // Replace with actual frontend domain
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(morgan('combined'));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit if connection fails
  }
};

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint (moved before other routes for better performance)
app.get('/api/health', (req, res) => {
  console.log('Health check requested from:', req.ip, req.get('User-Agent'));
  res.status(200).json({
    success: true,
    message: 'eBanking Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    requestInfo: {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });
});

// Routes - ORDER MATTERS!
// Auth routes (no authentication required)
app.use('/api/auth', require('./routes/auth'));

// Other protected routes
app.use('/api/verification', require('./routes/verification'));
app.use('/api/user', require('./routes/user'));
app.use('/api/cards', require('./routes/card'));
app.use('/api/address', require('./routes/address'));
app.use('/api/transaction', require('./routes/transaction'));
app.use('/api/bank', require('./routes/bank'));
app.use('/api/bankTransfer', require('./routes/bankTransfer'));
app.use('/api/cryptoWallet', require('./routes/cryptoWallet'));
app.use('/api/cryptoTransaction', require('./routes/cryptoTransaction'));
app.use('/api/referral', require('./routes/referral'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/achievement', require('./routes/achievement'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - MUST be last
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedRoute: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 4022;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

// Start the server only after database connection is established
const startServer = async () => {
  try {
    await connectDB(); // Wait for DB connection
    app.listen(PORT, () => {
      console.log(`🚀 eBanking Backend Server is running on port ${PORT}!`);
      console.log(`📚 API Documentation available at: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health check endpoint: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/register`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer().catch(error => {
  console.error('Startup error:', error);
  process.exit(1);
});

module.exports = app;