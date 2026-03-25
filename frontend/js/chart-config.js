/**
 * ============================================
 * Chart.js Configuration
 * ============================================
 * 
 * Configures and manages the real-time line chart
 * for displaying moisture history data.
 * 
 * Features:
 * - Real-time data updates
 * - Gradient fill
 * - Custom tooltips
 * - Responsive sizing
 */

(function () {
    'use strict';

    // ============================================
    // Configuration
    // ============================================

    const CONFIG = {
        maxDataPoints: 50,
        defaultHours: 6,
        colors: {
            primary: '#10b981',
            primaryLight: 'rgba(16, 185, 129, 0.2)',
            grid: 'rgba(255, 255, 255, 0.1)',
            text: '#9ca3af'
        }
    };

    // ============================================
    // Chart Instance
    // ============================================

    let chartInstance = null;
    let chartData = {
        labels: [],
        datasets: [{
            label: 'Moisture %',
            data: [],
            borderColor: CONFIG.colors.primary,
            backgroundColor: CONFIG.colors.primaryLight,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: CONFIG.colors.primary,
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: CONFIG.colors.primary,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        }]
    };

    // ============================================
    // Chart Options
    // ============================================

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#fff',
                bodyColor: '#9ca3af',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                displayColors: false,
                callbacks: {
                    title: function (tooltipItems) {
                        return tooltipItems[0].label;
                    },
                    label: function (context) {
                        return `Moisture: ${context.raw}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    color: CONFIG.colors.grid,
                    drawBorder: false
                },
                ticks: {
                    color: CONFIG.colors.text,
                    maxRotation: 0,
                    maxTicksLimit: 6,
                    font: {
                        size: 11
                    }
                }
            },
            y: {
                display: true,
                min: 0,
                max: 100,
                grid: {
                    color: CONFIG.colors.grid,
                    drawBorder: false
                },
                ticks: {
                    color: CONFIG.colors.text,
                    stepSize: 20,
                    font: {
                        size: 11
                    },
                    callback: function (value) {
                        return value + '%';
                    }
                }
            }
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        }
    };

    // ============================================
    // Chart Functions
    // ============================================

    /**
     * Initialize the Chart.js chart
     */
    function initChart() {
        const canvas = document.getElementById('moistureChart');
        if (!canvas) {
            console.warn('Chart canvas not found');
            return;
        }

        // Create gradient fill
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
        gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.1)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

        chartData.datasets[0].backgroundColor = gradient;

        // Create chart instance
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });

        // Setup chart time range buttons
        setupChartButtons();
    }

    /**
     * Update chart with new data
     * @param {Array} historyData - Array of {timestamp, value} objects
     */
    function updateChart(historyData) {
        if (!chartInstance) {
            initChart();
        }

        if (!historyData || !historyData.length) return;

        // Format data for chart
        const labels = [];
        const values = [];

        historyData.forEach(item => {
            const date = new Date(item.timestamp);
            labels.push(formatTime(date));
            values.push(Math.round(item.value));
        });

        // Update chart data
        chartInstance.data.labels = labels;
        chartInstance.data.datasets[0].data = values;
        chartInstance.update('none');
    }

    /**
     * Add a single data point to the chart
     * @param {number} value - Moisture value
     * @param {number} timestamp - Unix timestamp
     */
    function addDataPoint(value, timestamp) {
        if (!chartInstance) return;

        const date = new Date(timestamp);
        const label = formatTime(date);

        // Add new data
        chartInstance.data.labels.push(label);
        chartInstance.data.datasets[0].data.push(Math.round(value));

        // Remove old data if exceeding max points
        if (chartInstance.data.labels.length > CONFIG.maxDataPoints) {
            chartInstance.data.labels.shift();
            chartInstance.data.datasets[0].data.shift();
        }

        chartInstance.update('none');
    }

    /**
     * Format timestamp for chart labels
     * @param {Date} date - Date object
     * @returns {string} Formatted time string
     */
    function formatTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    /**
     * Setup chart time range buttons
     */
    function setupChartButtons() {
        const buttons = document.querySelectorAll('.chart-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Get hours from data attribute
                const hours = parseInt(btn.dataset.hours) || 6;

                // Trigger data refresh with new time range
                if (window.Dashboard && window.Dashboard.loadHistory) {
                    window.Dashboard.loadHistory(hours);
                }
            });
        });
    }

    /**
     * Clear all chart data
     */
    function clearChart() {
        if (!chartInstance) return;

        chartInstance.data.labels = [];
        chartInstance.data.datasets[0].data = [];
        chartInstance.update('none');
    }

    // ============================================
    // Initialization
    // ============================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChart);
    } else {
        initChart();
    }

    // ============================================
    // Export to Global Scope
    // ============================================

    window.MoistureChart = {
        update: updateChart,
        addPoint: addDataPoint,
        clear: clearChart,
        getInstance: () => chartInstance
    };

})();
