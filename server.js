const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// Initialize Express app
const app = express();

// Connect to MongoDB Atlas / Local MongoDB
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Cloud Vehicle Service Booking System',
    timestamp: new Date().toISOString()
  });
});

// Clean URL Route Rewrites for Frontend Pages
const servePage = (pageName) => (req, res) => {
  res.sendFile(path.join(__dirname, 'public', pageName));
};

app.get('/login', servePage('login.html'));
app.get('/register', servePage('register.html'));
app.get('/customer-dashboard', servePage('customer-dashboard.html'));
app.get('/book-service', servePage('book-service.html'));
app.get('/my-bookings', servePage('my-bookings.html'));
app.get('/admin-dashboard', servePage('admin-dashboard.html'));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' was not found on this server`
  });
});

// Fallback for HTML5 client routing (return index.html for unmatched browser paths)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start HTTP Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚗 Cloud Vehicle Service Booking System Server Started`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=======================================================`);
});
