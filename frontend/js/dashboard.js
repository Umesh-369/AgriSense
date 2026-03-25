/**
 * ============================================
 * Dashboard Main Controller
 * ============================================
 * 
 * Manages all dashboard functionality:
 * - Real-time data fetching
 * - UI updates
 * - Alert system
 * - Connection status
 * - 3D background
 */

(function () {
    'use strict';

    // ============================================
    // Configuration
    // ============================================

    const CONFIG = {
        // API settings
        apiBaseUrl: window.API_BASE_URL || 'http://localhost:3000/api',

        // Polling interval in milliseconds
        pollInterval: 5000,

        // Alert thresholds
        alertThreshold: 20,

        // History settings
        defaultHistoryHours: 6
    };

    // ============================================
    // State
    // ============================================

    let state = {
        isConnected: false,
        lastMoisture: null,
        alertShown: false,
        alertDismissedAt: null,
        pollTimer: null
    };

    // ============================================
    // DOM Elements
    // ============================================

    const elements = {
        // Header
        lastUpdated: document.getElementById('lastUpdated'),
        dataSource: document.getElementById('dataSource'),

        // Status
        statusIcon: document.getElementById('statusIcon'),
        statusText: document.getElementById('statusText'),
        statusMessage: document.getElementById('statusMessage'),
        statusDisplay: document.getElementById('statusDisplay'),

        // Thresholds
        thresholdLow: document.getElementById('thresholdLow'),
        thresholdHigh: document.getElementById('thresholdHigh'),

        // Stats
        avgValue: document.getElementById('avgValue'),
        avgTrend: document.getElementById('avgTrend'),
        minValue: document.getElementById('minValue'),
        maxValue: document.getElementById('maxValue'),
        readingsCount: document.getElementById('readingsCount'),

        // History
        historyList: document.getElementById('historyList'),

        // Alert
        alertOverlay: document.getElementById('alertOverlay'),
        alertValue: document.getElementById('alertValue'),
        alertClose: document.getElementById('alertClose'),

        // Connection
        connectionDot: document.getElementById('connectionDot'),
        connectionText: document.getElementById('connectionText'),

        // Buttons
        refreshBtn: document.getElementById('refreshBtn')
    };

    // ============================================
    // API Functions
    // ============================================

    /**
     * Fetch current moisture data
     * @returns {Promise<Object>} Moisture data
     */
    async function fetchCurrentData() {
        try {
            const response = await fetch(`${CONFIG.apiBaseUrl}/moisture/current`);
            if (!response.ok) throw new Error('API Error');
            return await response.json();
        } catch (error) {
            console.error('Error fetching current data:', error);
            updateConnectionStatus(false);
            return null;
        }
    }

    /**
     * Fetch moisture history
     * @param {number} hours - Hours of history to fetch
     * @returns {Promise<Object>} History data
     */
    async function fetchHistoryData(hours = CONFIG.defaultHistoryHours) {
        try {
            const response = await fetch(
                `${CONFIG.apiBaseUrl}/moisture/history?hours=${hours}`
            );
            if (!response.ok) throw new Error('API Error');
            return await response.json();
        } catch (error) {
            console.error('Error fetching history:', error);
            return null;
        }
    }

    /**
     * Fetch threshold configuration
     * @returns {Promise<Object>} Threshold data
     */
    async function fetchThresholds() {
        try {
            const response = await fetch(`${CONFIG.apiBaseUrl}/moisture/thresholds`);
            if (!response.ok) throw new Error('API Error');
            return await response.json();
        } catch (error) {
            console.error('Error fetching thresholds:', error);
            return null;
        }
    }

    // ============================================
    // UI Update Functions
    // ============================================

    /**
     * Update the dashboard with current moisture data
     * @param {Object} data - Moisture data from API
     */
    function updateCurrentDisplay(data) {
        if (!data || !data.success) return;

        const { value, timestamp, analysis } = data.data;

        // Update gauge
        if (window.Gauge) {
            window.Gauge.update(value);
        }

        // Update last updated time
        if (elements.lastUpdated) {
            elements.lastUpdated.textContent = formatTime(new Date(timestamp));
        }

        // Update data source
        if (elements.dataSource) {
            elements.dataSource.textContent = data.source === 'firebase' ? 'Firebase' : 'Demo Mode';
        }

        // Update status display
        updateStatusDisplay(analysis);

        // Check for alerts
        checkAlert(value, analysis);

        // Update connection status
        updateConnectionStatus(true, data.source);

        // Store last value
        state.lastMoisture = value;
    }

    /**
     * Update status display section
     * @param {Object} analysis - Moisture analysis data
     */
    function updateStatusDisplay(analysis) {
        if (!analysis) return;

        const statusIcons = {
            dry: '🔥',
            low: '⚠️',
            optimal: '✅',
            high: '💧',
            wet: '🌊'
        };

        if (elements.statusIcon) {
            elements.statusIcon.textContent = statusIcons[analysis.status] || '🌱';
        }

        if (elements.statusText) {
            elements.statusText.textContent = analysis.status.toUpperCase();
            elements.statusText.style.color = analysis.color;
        }

        if (elements.statusMessage) {
            elements.statusMessage.textContent = analysis.message;
        }

        if (elements.statusDisplay) {
            elements.statusDisplay.style.borderColor = analysis.color;
        }
    }

    /**
     * Update history list and stats
     * @param {Object} historyData - History data from API
     */
    function updateHistoryDisplay(historyData) {
        if (!historyData || !historyData.success) return;

        const readings = historyData.data;

        // Update chart
        if (window.MoistureChart) {
            window.MoistureChart.update(readings);
        }

        // Calculate stats
        if (readings.length > 0) {
            const values = readings.map(r => r.value);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);

            if (elements.avgValue) {
                elements.avgValue.textContent = `${avg.toFixed(1)}%`;
            }
            if (elements.minValue) {
                elements.minValue.textContent = `${min.toFixed(1)}%`;
            }
            if (elements.maxValue) {
                elements.maxValue.textContent = `${max.toFixed(1)}%`;
            }
            if (elements.readingsCount) {
                elements.readingsCount.textContent = readings.length;
            }

            // Calculate trend
            if (readings.length >= 2) {
                const recentAvg = values.slice(-5).reduce((a, b) => a + b, 0) /
                    Math.min(5, values.length);
                const trend = recentAvg - avg;

                if (elements.avgTrend) {
                    if (trend > 2) {
                        elements.avgTrend.textContent = '↑ Rising';
                        elements.avgTrend.className = 'stat-trend up';
                    } else if (trend < -2) {
                        elements.avgTrend.textContent = '↓ Falling';
                        elements.avgTrend.className = 'stat-trend down';
                    } else {
                        elements.avgTrend.textContent = '→ Stable';
                        elements.avgTrend.className = 'stat-trend';
                    }
                }
            }
        }

        // Update history list
        updateHistoryList(readings.slice(-10).reverse());
    }

    /**
     * Update the recent readings history list
     * @param {Array} readings - Array of recent readings
     */
    function updateHistoryList(readings) {
        if (!elements.historyList) return;

        elements.historyList.innerHTML = readings.map(reading => {
            const color = reading.analysis ? reading.analysis.color : '#10b981';
            const time = formatTime(new Date(reading.timestamp));

            return `
                <div class="history-item">
                    <div class="history-dot" style="background: ${color}"></div>
                    <div class="history-info">
                        <div class="history-value" style="color: ${color}">
                            ${reading.value.toFixed(1)}%
                        </div>
                        <div class="history-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Update thresholds display
     * @param {Object} data - Threshold data
     */
    function updateThresholds(data) {
        if (!data || !data.success) return;

        if (elements.thresholdLow) {
            elements.thresholdLow.textContent = `${data.data.low}%`;
        }
        if (elements.thresholdHigh) {
            elements.thresholdHigh.textContent = `${data.data.high}%`;
        }
    }

    // ============================================
    // Alert System
    // ============================================

    /**
     * Check if alert should be shown
     * @param {number} value - Current moisture value
     * @param {Object} analysis - Moisture analysis
     */
    function checkAlert(value, analysis) {
        // Only show alert for critical low moisture
        const shouldAlert = analysis &&
            (analysis.status === 'dry' || analysis.status === 'low') &&
            value < CONFIG.alertThreshold;

        // Check if we recently dismissed the alert
        const alertCooldown = 60000; // 1 minute
        if (state.alertDismissedAt &&
            Date.now() - state.alertDismissedAt < alertCooldown) {
            return;
        }

        if (shouldAlert && !state.alertShown) {
            showAlert(value);
        }
    }

    /**
     * Show alert popup
     * @param {number} value - Moisture value
     */
    function showAlert(value) {
        if (!elements.alertOverlay) return;

        if (elements.alertValue) {
            elements.alertValue.textContent = `${value.toFixed(1)}%`;
        }

        elements.alertOverlay.classList.add('active');
        state.alertShown = true;

        // Add shake animation to the page
        document.body.style.animation = 'shake 0.5s';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 500);
    }

    /**
     * Hide alert popup
     */
    function hideAlert() {
        if (!elements.alertOverlay) return;

        elements.alertOverlay.classList.remove('active');
        state.alertShown = false;
        state.alertDismissedAt = Date.now();
    }

    // ============================================
    // Connection Status
    // ============================================

    /**
     * Update connection status indicator
     * @param {boolean} connected - Connection status
     * @param {string} source - Data source
     */
    function updateConnectionStatus(connected, source = 'demo') {
        state.isConnected = connected;

        if (elements.connectionDot) {
            elements.connectionDot.className = 'connection-dot';
            if (connected) {
                if (source === 'firebase') {
                    elements.connectionDot.classList.add('connected');
                } else {
                    elements.connectionDot.classList.add('demo');
                }
            } else {
                elements.connectionDot.classList.add('disconnected');
            }
        }

        if (elements.connectionText) {
            if (connected) {
                elements.connectionText.textContent =
                    source === 'firebase' ? 'Connected' : 'Demo Mode';
            } else {
                elements.connectionText.textContent = 'Disconnected';
            }
        }
    }

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Format date to time string
     * @param {Date} date - Date object
     * @returns {string} Formatted time
     */
    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    // ============================================
    // 3D Background
    // ============================================

    /**
     * Initialize 3D background using Three.js
     */
    function init3DBackground() {
        const canvas = document.getElementById('dashboardCanvas');
        if (!canvas || typeof THREE === 'undefined') return;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 50;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Create floating particles
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x10b981,
            size: 0.5,
            transparent: true,
            opacity: 0.6
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Animation
        function animate() {
            requestAnimationFrame(animate);
            particles.rotation.y += 0.0005;
            particles.rotation.x += 0.0002;
            renderer.render(scene, camera);
        }
        animate();

        // Resize handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // ============================================
    // Main Functions
    // ============================================

    /**
     * Load all dashboard data
     */
    async function loadDashboard() {
        // Load current data
        const currentData = await fetchCurrentData();
        updateCurrentDisplay(currentData);

        // Load history
        const historyData = await fetchHistoryData(CONFIG.defaultHistoryHours);
        updateHistoryDisplay(historyData);

        // Load thresholds
        const thresholds = await fetchThresholds();
        updateThresholds(thresholds);
    }

    /**
     * Load history for specific time range
     * @param {number} hours - Hours of history
     */
    async function loadHistory(hours) {
        const historyData = await fetchHistoryData(hours);
        updateHistoryDisplay(historyData);
    }

    /**
     * Start polling for updates
     */
    function startPolling() {
        // Stop existing polling
        if (state.pollTimer) {
            clearInterval(state.pollTimer);
        }

        // Start new polling
        state.pollTimer = setInterval(async () => {
            const data = await fetchCurrentData();
            updateCurrentDisplay(data);
        }, CONFIG.pollInterval);
    }

    /**
     * Initialize dashboard
     */
    async function init() {
        console.log('🌱 Initializing Dashboard...');

        // Initialize 3D background
        init3DBackground();

        // Load initial data
        await loadDashboard();

        // Start polling
        startPolling();

        // Setup event listeners
        if (elements.alertClose) {
            elements.alertClose.addEventListener('click', hideAlert);
        }

        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                loadDashboard();
            });
        }

        // Click outside alert to close
        if (elements.alertOverlay) {
            elements.alertOverlay.addEventListener('click', (e) => {
                if (e.target === elements.alertOverlay) {
                    hideAlert();
                }
            });
        }

        console.log('✅ Dashboard initialized successfully');
    }

    // ============================================
    // Start Dashboard
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================
    // Export to Global Scope
    // ============================================

    window.Dashboard = {
        refresh: loadDashboard,
        loadHistory: loadHistory
    };

})();
