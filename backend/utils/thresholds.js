/**
 * ============================================
 * Moisture Threshold Utilities
 * ============================================
 * 
 * This module handles moisture level categorization,
 * color coding, and alert logic for the monitoring system.
 */

// Default threshold values (can be overridden by .env)
const THRESHOLDS = {
    LOW: parseInt(process.env.MOISTURE_LOW_THRESHOLD) || 30,
    HIGH: parseInt(process.env.MOISTURE_HIGH_THRESHOLD) || 70
};

/**
 * Moisture status categories
 */
const STATUS = {
    DRY: 'dry',
    LOW: 'low',
    OPTIMAL: 'optimal',
    HIGH: 'high',
    WET: 'wet'
};

/**
 * Color codes for different moisture levels
 */
const COLORS = {
    [STATUS.DRY]: '#ef4444',      // Red - Critical
    [STATUS.LOW]: '#f97316',      // Orange - Warning
    [STATUS.OPTIMAL]: '#22c55e',  // Green - Good
    [STATUS.HIGH]: '#3b82f6',     // Blue - High
    [STATUS.WET]: '#6366f1'       // Indigo - Very wet
};

/**
 * Get the status category for a moisture value
 * @param {number} moisture - Moisture percentage (0-100)
 * @returns {string} Status category
 */
function getStatus(moisture) {
    if (moisture < 20) return STATUS.DRY;
    if (moisture < THRESHOLDS.LOW) return STATUS.LOW;
    if (moisture <= THRESHOLDS.HIGH) return STATUS.OPTIMAL;
    if (moisture <= 85) return STATUS.HIGH;
    return STATUS.WET;
}

/**
 * Get color code for a moisture value
 * @param {number} moisture - Moisture percentage (0-100)
 * @returns {string} Hex color code
 */
function getColor(moisture) {
    const status = getStatus(moisture);
    return COLORS[status];
}

/**
 * Get human-readable status message
 * @param {number} moisture - Moisture percentage (0-100)
 * @returns {string} Status message
 */
function getMessage(moisture) {
    const status = getStatus(moisture);
    const messages = {
        [STATUS.DRY]: '🚨 Critical! Soil is very dry. Immediate watering required!',
        [STATUS.LOW]: '⚠️ Warning! Moisture is low. Consider watering soon.',
        [STATUS.OPTIMAL]: '✅ Perfect! Moisture level is optimal for plant growth.',
        [STATUS.HIGH]: '💧 Good! Soil has plenty of moisture.',
        [STATUS.WET]: '🌊 Caution! Soil is very wet. Avoid overwatering.'
    };
    return messages[status];
}

/**
 * Check if moisture level should trigger an alert
 * @param {number} moisture - Moisture percentage (0-100)
 * @returns {Object} Alert details
 */
function checkAlert(moisture) {
    const status = getStatus(moisture);
    const needsAlert = status === STATUS.DRY || status === STATUS.LOW;

    return {
        triggered: needsAlert,
        severity: status === STATUS.DRY ? 'critical' : (needsAlert ? 'warning' : 'none'),
        status: status,
        color: getColor(moisture),
        message: getMessage(moisture)
    };
}

/**
 * Get full analysis of moisture reading
 * @param {number} moisture - Moisture percentage (0-100)
 * @returns {Object} Complete moisture analysis
 */
function analyze(moisture) {
    return {
        value: moisture,
        percentage: `${moisture}%`,
        status: getStatus(moisture),
        color: getColor(moisture),
        message: getMessage(moisture),
        alert: checkAlert(moisture),
        thresholds: {
            low: THRESHOLDS.LOW,
            high: THRESHOLDS.HIGH
        }
    };
}

module.exports = {
    THRESHOLDS,
    STATUS,
    COLORS,
    getStatus,
    getColor,
    getMessage,
    checkAlert,
    analyze
};
