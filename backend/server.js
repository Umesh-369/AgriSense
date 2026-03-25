/**
 * ============================================
 * Smart Soil Moisture Monitoring - Backend Server
 * ============================================
 * 
 * Express.js server that provides REST APIs for:
 * - Real-time soil moisture data from Firebase
 * - Historical moisture readings
 * - Threshold-based status and alerts
 * 
 * Features:
 * - CORS enabled for frontend access
 * - Demo mode when Firebase is not configured
 * - Well-structured API responses
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import Firebase configuration
const { initializeFirebase, isConnected } = require('./firebase-config');

// Import routes
const moistureRoutes = require('./routes/moisture');

const weatherRoutes = require('./routes/weather');
const cropPricesRoutes = require('./routes/crop-prices');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware Configuration
// ============================================

// Enable CORS for all origins (configure for production)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// API Routes
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        firebase: isConnected() ? 'connected' : 'demo mode',
        version: '1.0.0'
    });
});

// Moisture data routes
app.use('/api/moisture', moistureRoutes);

// Chatbot routes
const chatbotRoutes = require('./routes/chatbot');
app.use('/api', chatbotRoutes);

// Weather routes
app.use('/api/weather', weatherRoutes);

// Crop prices routes
app.use('/api/crops', cropPricesRoutes);

// ============================================
// Frontend Routes
// ============================================

// Serve home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================
// Server Startup
// ============================================

// Initialize Firebase
console.log('\n🌱 Smart Soil Moisture Monitoring System');
console.log('=========================================\n');

initializeFirebase();

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   - GET /api/health`);
    console.log(`   - GET /api/moisture/current`);
    console.log(`   - GET /api/moisture/history`);
    console.log(`   - GET /api/moisture/status`);
    console.log(`   - GET /api/moisture/thresholds`);
    console.log(`\n🌐 Frontend:`);
    console.log(`   - Home: http://localhost:${PORT}/`);
    console.log(`   - Dashboard: http://localhost:${PORT}/dashboard`);
    console.log('\n');
});

module.exports = app;
