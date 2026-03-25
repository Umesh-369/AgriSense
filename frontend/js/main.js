/**
 * ============================================
 * Main JavaScript - Common Functionality
 * ============================================
 * 
 * Handles common functionality across all pages:
 * - Navigation toggle
 * - Smooth scrolling
 * - Loading states
 * - Utility functions
 */

(function () {
    'use strict';

    // ============================================
    // DOM Ready
    // ============================================

    document.addEventListener('DOMContentLoaded', () => {
        initNavigation();
        initSmoothScroll();
        initLoadingState();
    });

    // ============================================
    // Navigation Toggle (Mobile)
    // ============================================

    function initNavigation() {
        const navToggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');

        if (navToggle && navLinks) {
            navToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');

                // Animate hamburger to X
                navToggle.classList.toggle('active');
            });

            // Close menu when clicking a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    navToggle.classList.remove('active');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                    navLinks.classList.remove('active');
                    navToggle.classList.remove('active');
                }
            });
        }
    }

    // ============================================
    // Smooth Scroll for Non-GSAP Fallback
    // ============================================

    function initSmoothScroll() {
        // Only if GSAP is not available
        if (typeof gsap !== 'undefined') return;

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ============================================
    // Loading State
    // ============================================

    function initLoadingState() {
        // Hide loading overlay if exists
        const loader = document.querySelector('.page-loader');
        if (loader) {
            window.addEventListener('load', () => {
                loader.classList.add('loaded');
                setTimeout(() => {
                    loader.remove();
                }, 500);
            });
        }
    }

    // ============================================
    // Utility Functions
    // ============================================

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    window.debounce = function (func, wait = 100) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function} Throttled function
     */
    window.throttle = function (func, limit = 100) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    window.formatNumber = function (num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    /**
     * Get relative time string
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Relative time string
     */
    window.getRelativeTime = function (timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return new Date(timestamp).toLocaleDateString();
    };

    /**
     * Check if element is in viewport
     * @param {Element} el - DOM element
     * @returns {boolean} True if in viewport
     */
    window.isInViewport = function (el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    };

    // ============================================
    // API Configuration
    // ============================================

    window.API_BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : '/api';

    /**
     * Make API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise} API response
     */
    window.apiRequest = async function (endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    };

    // ============================================
    // Console Branding
    // ============================================

    console.log(
        '%c🌱 SoilSense',
        'color: #10b981; font-size: 24px; font-weight: bold;'
    );
    console.log(
        '%cSmart Soil Moisture Monitoring System',
        'color: #6b7280; font-size: 12px;'
    );

})();
