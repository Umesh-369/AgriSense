/**
 * ============================================
 * IoT Data Simulator
 * ============================================
 * 
 * Simulates soil moisture sensor readings and
 * uploads them to Firebase Realtime Database.
 * 
 * Useful for testing without actual hardware.
 * 
 * Usage:
 *   node data_simulator.js
 * 
 * Configure the interval in milliseconds below.
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Configuration
const INTERVAL_MS = 5000;  // Update every 5 seconds
const MIN_MOISTURE = 15;
const MAX_MOISTURE = 90;

let currentMoisture = 55;
let db = null;

/**
 * Initialize Firebase connection
 */
function initFirebase() {
    try {
        // Check for service account file
        const serviceAccountPath = path.join(__dirname, '../backend/serviceAccountKey.json');

        let serviceAccount;
        try {
            serviceAccount = require(serviceAccountPath);
        } catch (e) {
            console.log('⚠️  No serviceAccountKey.json found');
            console.log('📁 Please add your Firebase service account key file');
            console.log('   Location: backend/serviceAccountKey.json\n');
            return false;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });

        db = admin.database();
        console.log('🔥 Connected to Firebase\n');
        return true;

    } catch (error) {
        console.error('❌ Firebase error:', error.message);
        return false;
    }
}

/**
 * Generate realistic moisture variation
 * @returns {number} New moisture value
 */
function generateMoisture() {
    // Random walk with bounds and occasional jumps
    const changeType = Math.random();
    let change;

    if (changeType < 0.7) {
        // Small gradual change (70% of time)
        change = (Math.random() - 0.5) * 5;
    } else if (changeType < 0.9) {
        // Medium change (20% of time)
        change = (Math.random() - 0.5) * 15;
    } else {
        // Larger jump (10% of time) - simulates watering or rapid drying
        change = (Math.random() - 0.5) * 30;
    }

    // Apply change with bounds
    currentMoisture = Math.max(
        MIN_MOISTURE,
        Math.min(MAX_MOISTURE, currentMoisture + change)
    );

    return Math.round(currentMoisture * 10) / 10;
}

/**
 * Get status info for moisture value
 * @param {number} value - Moisture percentage
 * @returns {Object} Status information
 */
function getStatus(value) {
    if (value < 20) return { status: 'dry', color: '#ef4444' };
    if (value < 30) return { status: 'low', color: '#f97316' };
    if (value <= 70) return { status: 'optimal', color: '#22c55e' };
    if (value <= 85) return { status: 'high', color: '#3b82f6' };
    return { status: 'wet', color: '#6366f1' };
}

/**
 * Upload data to Firebase
 * @param {number} moisture - Moisture value to upload
 */
async function uploadData(moisture) {
    const timestamp = Date.now();
    const statusInfo = getStatus(moisture);

    const data = {
        value: moisture,
        timestamp: timestamp,
        status: statusInfo.status,
        device: 'simulator'
    };

    try {
        // Update current reading
        await db.ref('moisture/current').set(data);

        // Add to history
        await db.ref('moisture/readings').push({
            ...data,
            id: `sim_${timestamp}`
        });

        // Log with colored output
        const statusEmoji = {
            dry: '🔴',
            low: '🟠',
            optimal: '🟢',
            high: '🔵',
            wet: '🟣'
        };

        console.log(
            `${statusEmoji[statusInfo.status]} ` +
            `Moisture: ${moisture.toFixed(1)}% | ` +
            `Status: ${statusInfo.status} | ` +
            `Time: ${new Date(timestamp).toLocaleTimeString()}`
        );

    } catch (error) {
        console.error('❌ Upload error:', error.message);
    }
}

/**
 * Run the simulator
 */
function startSimulator() {
    console.log('🌱 Soil Moisture Data Simulator');
    console.log('================================\n');

    if (!initFirebase()) {
        console.log('\n💡 To use this simulator:');
        console.log('   1. Create a Firebase project');
        console.log('   2. Enable Realtime Database');
        console.log('   3. Download service account key');
        console.log('   4. Save as backend/serviceAccountKey.json');
        console.log('   5. Update backend/.env with database URL\n');
        return;
    }

    console.log(`📊 Sending data every ${INTERVAL_MS / 1000} seconds`);
    console.log('   Press Ctrl+C to stop\n');

    // Initial upload
    uploadData(generateMoisture());

    // Schedule regular uploads
    setInterval(() => {
        uploadData(generateMoisture());
    }, INTERVAL_MS);
}

// Start the simulator
startSimulator();
