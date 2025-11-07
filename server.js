const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const session = require('express-session');
const { initDatabase } = require('./database/init');
require('dotenv').config();

// Check if running in Vercel serverless environment
const isVercel = process.env.VERCEL === '1';

// Environment validation
function validateEnvironment() {
    const required = ['JWT_SECRET', 'SESSION_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('Missing required environment variables:');
        missing.forEach(key => console.error(`  - ${key}`));
        console.error('Please copy .env.example to .env and fill in the required values');
        process.exit(1);
    }
    
    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET.length < 32) {
        console.error('JWT_SECRET must be at least 32 characters long for security');
        process.exit(1);
    }
    
    console.log('Environment validation passed ✓');
}

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO only if not in Vercel serverless environment
let io;
if (!isVercel) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://usabo-website.vercel.app'] // Your production domain
    : ['http://localhost:3002', 'http://127.0.0.1:3002'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More restrictive in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// More restrictive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 auth attempts per window
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use(limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/textbook', require('./routes/textbook'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/community', require('./routes/community'));

// Socket.io for real-time chat (only if not in Vercel)
if (io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
    });
    
    socket.on('chat-message', (data) => {
      io.to(data.room).emit('chat-message', data);
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

// Main route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const PORT = process.env.PORT || 3002;

// Initialize database and start server
async function startServer() {
  try {
    // Validate environment first
    validateEnvironment();
    
    // Initialize database
    await initDatabase();
    console.log('Database initialized successfully');
    
    // Only start server if not in Vercel (Vercel handles this)
    if (!isVercel) {
      server.listen(PORT, () => {
        console.log(`USABO Website running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } else {
      console.log('Running in Vercel serverless environment');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    if (!isVercel) {
      process.exit(1);
    }
  }
}

// Initialize the server
if (isVercel) {
  // For Vercel: initialize async but don't start server
  startServer().catch((error) => {
    console.error('Initialization failed:', error);
  });
} else {
  // For local development: start the server normally
  startServer();
}

// Always export the app for both Vercel and local use
module.exports = app;