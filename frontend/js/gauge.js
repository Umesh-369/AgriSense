/**
 * ============================================
 * Circular Gauge Component
 * ============================================
 * 
 * Creates and animates the SVG-based circular gauge
 * for displaying soil moisture percentage.
 * 
 * Features:
 * - Smooth value transitions with GSAP
 * - Dynamic color based on value
 * - Glow effect animation
 */

(function () {
    'use strict';

    // ============================================
    // Configuration
    // ============================================

    const CONFIG = {
        // SVG circle parameters
        circumference: 2 * Math.PI * 45, // radius = 45

        // Color thresholds
        colors: {
            critical: '#ef4444',  // 0-20%
            low: '#f97316',       // 20-30%
            optimal: '#22c55e',   // 30-70%
            high: '#3b82f6',      // 70-85%
            wet: '#6366f1'        // 85-100%
        },

        // Animation duration in seconds
        animationDuration: 1.5
    };

    // ============================================
    // DOM Elements
    // ============================================

    const elements = {
        gaugeFill: document.getElementById('gaugeFill'),
        gaugeValue: document.getElementById('gaugeValue'),
        gaugeGlow: document.getElementById('gaugeGlow'),
        gaugeStatus: document.getElementById('gaugeStatus')
    };

    // Current gauge value
    let currentValue = 0;

    // ============================================
    // Color Functions
    // ============================================

    /**
     * Get color based on moisture value
     * @param {number} value - Moisture percentage (0-100)
     * @returns {string} Hex color code
     */
    function getColor(value) {
        if (value < 20) return CONFIG.colors.critical;
        if (value < 30) return CONFIG.colors.low;
        if (value <= 70) return CONFIG.colors.optimal;
        if (value <= 85) return CONFIG.colors.high;
        return CONFIG.colors.wet;
    }

    /**
     * Get glow color (lighter version for radial gradient)
     * @param {number} value - Moisture percentage
     * @returns {string} RGBA color string
     */
    function getGlowColor(value) {
        const color = getColor(value);
        // Convert hex to RGB and add alpha
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.4)`;
    }

    // ============================================
    // Gauge Update Function
    // ============================================

    /**
     * Update the gauge with a new value
     * @param {number} value - Moisture percentage (0-100)
     * @param {boolean} animate - Whether to animate the transition
     */
    function updateGauge(value, animate = true) {
        if (!elements.gaugeFill || !elements.gaugeValue) {
            console.warn('Gauge elements not found');
            return;
        }

        // Clamp value to 0-100
        value = Math.max(0, Math.min(100, value));

        // Calculate stroke dashoffset
        const offset = CONFIG.circumference - (value / 100) * CONFIG.circumference;
        const color = getColor(value);

        if (animate && typeof gsap !== 'undefined') {
            // Animate with GSAP
            gsap.to(elements.gaugeFill, {
                strokeDashoffset: offset,
                stroke: color,
                duration: CONFIG.animationDuration,
                ease: 'power2.out'
            });

            // Animate the value counter
            gsap.to({ val: currentValue }, {
                val: value,
                duration: CONFIG.animationDuration,
                ease: 'power2.out',
                onUpdate: function () {
                    elements.gaugeValue.textContent = this.targets()[0].val.toFixed(1);
                }
            });

            // Animate glow color
            if (elements.gaugeGlow) {
                gsap.to(elements.gaugeGlow, {
                    background: `radial-gradient(circle, ${getGlowColor(value)} 0%, transparent 70%)`,
                    duration: CONFIG.animationDuration
                });
            }
        } else {
            // Immediate update without animation
            elements.gaugeFill.style.strokeDashoffset = offset;
            elements.gaugeFill.style.stroke = color;
            elements.gaugeValue.textContent = value.toFixed(1);

            if (elements.gaugeGlow) {
                elements.gaugeGlow.style.background =
                    `radial-gradient(circle, ${getGlowColor(value)} 0%, transparent 70%)`;
            }
        }

        // Update status text
        if (elements.gaugeStatus) {
            elements.gaugeStatus.textContent = getStatusText(value);
            elements.gaugeStatus.style.color = color;
        }

        currentValue = value;
    }

    /**
     * Get status text based on value
     * @param {number} value - Moisture percentage
     * @returns {string} Status text
     */
    function getStatusText(value) {
        if (value < 20) return 'Critical';
        if (value < 30) return 'Low';
        if (value <= 70) return 'Optimal';
        if (value <= 85) return 'High';
        return 'Very Wet';
    }

    // ============================================
    // Initialization
    // ============================================

    /**
     * Initialize the gauge
     */
    function initGauge() {
        if (!elements.gaugeFill) return;

        // Set initial stroke dasharray
        elements.gaugeFill.style.strokeDasharray = CONFIG.circumference;
        elements.gaugeFill.style.strokeDashoffset = CONFIG.circumference;

        // Add pulse animation to glow
        if (elements.gaugeGlow && typeof gsap !== 'undefined') {
            gsap.to(elements.gaugeGlow, {
                scale: 1.1,
                opacity: 0.8,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGauge);
    } else {
        initGauge();
    }

    // ============================================
    // Export to Global Scope
    // ============================================

    window.Gauge = {
        update: updateGauge,
        getColor: getColor,
        getCurrentValue: () => currentValue
    };

})();
