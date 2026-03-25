/**
 * ============================================
 * Moisture API Routes
 * ============================================
 * 
 * REST API endpoints for soil moisture data:
 * - GET /api/moisture/current - Current reading
 * - GET /api/moisture/history - Historical data
 * - GET /api/moisture/status  - Status with alerts
 */

const express = require('express');
const router = express.Router();
const { getDatabase, isConnected } = require('../firebase-config');
const thresholds = require('../utils/thresholds');

// Demo data for when Firebase is not connected
let demoMoisture = 55;

/**
 * Generate realistic demo moisture data
 * Simulates gradual changes with some randomness
 */
function updateDemoMoisture() {
    // Random walk with bounds
    const change = (Math.random() - 0.5) * 10;
    demoMoisture = Math.max(10, Math.min(95, demoMoisture + change));
    // Return with 1 decimal point
    return Math.round(demoMoisture * 10) / 10;
}

/**
 * Generate demo historical data
 * @param {number} points - Number of data points
 * @returns {Array} Array of historical readings
 */
function generateDemoHistory(points = 24) {
    const history = [];
    let value = 60;
    const now = Date.now();

    for (let i = points - 1; i >= 0; i--) {
        // Create realistic variations
        value += (Math.random() - 0.5) * 15;
        value = Math.max(15, Math.min(90, value));

        history.push({
            timestamp: now - (i * 3600000), // Hourly intervals
            value: Math.round(value * 10) / 10,
            ...thresholds.analyze(Math.round(value * 10) / 10)
        });
    }

    return history;
}

/**
 * GET /api/moisture/current
 * Returns the current soil moisture reading
 */
router.get('/current', async (req, res) => {
    try {
        if (isConnected()) {
            const db = getDatabase();
            const snapshot = await db.collection('sensorData')
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                const moistureValue = data.moisture !== undefined ? data.moisture : data.value;

                // Check if value is valid and recent (within last 30 seconds)
                let tsMillis = data.timestamp;
                if (tsMillis && typeof tsMillis.toMillis === 'function') {
                    tsMillis = tsMillis.toMillis();
                }
                const isRecent = tsMillis && (Date.now() - tsMillis) < 30000;

                if (moistureValue > 0 && isRecent) {
                    return res.json({
                        success: true,
                        source: 'firebase',
                        data: {
                            value: moistureValue,
                            timestamp: tsMillis || Date.now(),
                            temperature: data.temperature,
                            analysis: thresholds.analyze(moistureValue)
                        }
                    });
                }
            }
        }

        // Fallback: demo data
        const moisture = updateDemoMoisture();
        res.json({
            success: true,
            source: 'demo',
            data: {
                value: moisture,
                timestamp: Date.now(),
                analysis: thresholds.analyze(moisture)
            }
        });
    } catch (error) {
        console.error('Error fetching current moisture:', error.message);
        const moisture = updateDemoMoisture();
        res.json({
            success: true,
            source: 'demo',
            data: {
                value: moisture,
                timestamp: Date.now(),
                analysis: thresholds.analyze(moisture)
            }
        });
    }
});

/**
 * GET /api/moisture/history
 * Returns historical moisture data
 * Query params:
 *   - hours: Number of hours of history (default: 24)
 *   - limit: Maximum number of records (default: 100)
 */
router.get('/history', async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const limit = parseInt(req.query.limit) || 100;

        if (isConnected()) {
            const db = getDatabase();
            const startTime = Date.now() - (hours * 3600000);

            const snapshot = await db.collection('sensorData')
                .where('timestamp', '>=', startTime)
                .orderBy('timestamp', 'desc')
                .limit(limit)
                .get();

            const readings = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const moistureValue = data.moisture !== undefined ? data.moisture : data.value;
                let tsMillis = data.timestamp;
                if (tsMillis && typeof tsMillis.toMillis === 'function') {
                    tsMillis = tsMillis.toMillis();
                }
                readings.push({
                    id: doc.id,
                    value: moistureValue,
                    timestamp: tsMillis || Date.now(),
                    temperature: data.temperature,
                    analysis: thresholds.analyze(moistureValue)
                });
            });

            // If Firebase returned data, use it; otherwise fall back to demo
            if (readings.length > 0) {
                return res.json({
                    success: true,
                    source: 'firebase',
                    count: readings.length,
                    data: readings
                });
            }
        }

        // Fallback: demo history
        const history = generateDemoHistory(Math.min(hours, limit));
        res.json({
            success: true,
            source: 'demo',
            count: history.length,
            data: history
        });
    } catch (error) {
        console.error('Error fetching history:', error.message);
        const history = generateDemoHistory(24);
        res.json({
            success: true,
            source: 'demo',
            count: history.length,
            data: history
        });
    }
});

/**
 * GET /api/moisture/status
 * Returns current status with threshold information and alerts
 */
router.get('/status', async (req, res) => {
    try {
        let moisture;
        let source = 'demo';

        if (isConnected()) {
            const db = getDatabase();
            const snapshot = await db.collection('sensorData')
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                moisture = data.moisture !== undefined ? data.moisture : data.value;
                source = 'firebase';
            }
        }

        // Use demo if no Firebase data
        if (moisture === undefined) {
            moisture = updateDemoMoisture();
        }

        const analysis = thresholds.analyze(moisture);

        res.json({
            success: true,
            source: source,
            data: {
                current: moisture,
                ...analysis,
                timestamp: Date.now()
            }
        });
    } catch (error) {
        console.error('Error fetching status:', error.message);

        const moisture = updateDemoMoisture();
        res.json({
            success: true,
            source: 'demo',
            data: {
                current: moisture,
                ...thresholds.analyze(moisture),
                timestamp: Date.now()
            }
        });
    }
});

/**
 * GET /api/moisture/thresholds
 * Returns the current threshold configuration
 */
router.get('/thresholds', (req, res) => {
    res.json({
        success: true,
        data: {
            low: thresholds.THRESHOLDS.LOW,
            high: thresholds.THRESHOLDS.HIGH,
            statuses: thresholds.STATUS,
            colors: thresholds.COLORS
        }
    });
});

module.exports = router;
