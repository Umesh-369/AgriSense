/**
 * ============================================
 * Crop Prices API Routes
 * ============================================
 * 
 * Provides crop market prices and selling recommendations
 * Uses simulated data based on realistic Indian market prices
 */

const express = require('express');
const router = express.Router();

// Simulated crop price data (would be replaced with real API in production)
// Prices are in INR per quintal
const CROP_DATA = {
    paddy: {
        name: 'Paddy (धान)',
        unit: 'quintal',
        currentPrice: 2250,
        msp: 2183, // Minimum Support Price 2024-25
        prices7day: [2180, 2200, 2220, 2230, 2240, 2260, 2250],
        prices30day: generateHistoricalPrices(2150, 2300, 30),
        season: 'Kharif',
        majorMarkets: ['Nizamabad', 'Karimnagar', 'Warangal']
    },
    rice: {
        name: 'Rice (चावल)',
        unit: 'quintal',
        currentPrice: 3850,
        msp: null,
        prices7day: [3780, 3800, 3820, 3830, 3840, 3860, 3850],
        prices30day: generateHistoricalPrices(3700, 3900, 30),
        season: 'All Year',
        majorMarkets: ['Nellore', 'Guntur', 'Vijayawada']
    },
    wheat: {
        name: 'Wheat (गेहूं)',
        unit: 'quintal',
        currentPrice: 2650,
        msp: 2275,
        prices7day: [2600, 2620, 2630, 2640, 2650, 2660, 2650],
        prices30day: generateHistoricalPrices(2500, 2700, 30),
        season: 'Rabi',
        majorMarkets: ['Indore', 'Bhopal', 'Dewas']
    },
    maize: {
        name: 'Maize (मक्का)',
        unit: 'quintal',
        currentPrice: 2150,
        msp: 2090,
        prices7day: [2100, 2110, 2130, 2140, 2150, 2160, 2150],
        prices30day: generateHistoricalPrices(2000, 2200, 30),
        season: 'Kharif/Rabi',
        majorMarkets: ['Davangere', 'Gulbarga', 'Bellary']
    },
    cotton: {
        name: 'Cotton (कपास)',
        unit: 'quintal',
        currentPrice: 7200,
        msp: 6620,
        prices7day: [7100, 7150, 7180, 7200, 7180, 7190, 7200],
        prices30day: generateHistoricalPrices(6800, 7400, 30),
        season: 'Kharif',
        majorMarkets: ['Guntur', 'Adilabad', 'Nagpur']
    },
    soybean: {
        name: 'Soybean (सोयाबीन)',
        unit: 'quintal',
        currentPrice: 4800,
        msp: 4600,
        prices7day: [4700, 4720, 4750, 4780, 4790, 4800, 4800],
        prices30day: generateHistoricalPrices(4500, 4900, 30),
        season: 'Kharif',
        majorMarkets: ['Indore', 'Ujjain', 'Latur']
    },
    groundnut: {
        name: 'Groundnut (मूंगफली)',
        unit: 'quintal',
        currentPrice: 6100,
        msp: 5850,
        prices7day: [5950, 6000, 6030, 6050, 6080, 6100, 6100],
        prices30day: generateHistoricalPrices(5800, 6200, 30),
        season: 'Kharif',
        majorMarkets: ['Junagadh', 'Rajkot', 'Gondal']
    },
    sugarcane: {
        name: 'Sugarcane (गन्ना)',
        unit: 'quintal',
        currentPrice: 350,
        msp: 315,
        prices7day: [340, 342, 345, 348, 350, 350, 350],
        prices30day: generateHistoricalPrices(310, 360, 30),
        season: 'All Year',
        majorMarkets: ['Kolhapur', 'Sangli', 'Meerut']
    }
};

/**
 * Generate realistic historical price data
 */
function generateHistoricalPrices(min, max, days) {
    const prices = [];
    let current = min + (max - min) / 2;

    for (let i = 0; i < days; i++) {
        const change = (Math.random() - 0.5) * (max - min) * 0.05;
        current = Math.max(min, Math.min(max, current + change));
        prices.push(Math.round(current));
    }

    return prices;
}

/**
 * GET /api/crops/prices
 * Get current prices for all crops
 */
router.get('/prices', (req, res) => {
    const prices = {};

    for (const [key, crop] of Object.entries(CROP_DATA)) {
        prices[key] = {
            name: crop.name,
            currentPrice: crop.currentPrice,
            unit: crop.unit,
            msp: crop.msp,
            change7d: calculatePriceChange(crop.prices7day),
            season: crop.season
        };
    }

    res.json({
        success: true,
        data: prices,
        timestamp: Date.now(),
        source: 'simulated'
    });
});

/**
 * GET /api/crops/prices/:crop
 * Get detailed price info for a specific crop
 */
router.get('/prices/:crop', (req, res) => {
    const cropKey = req.params.crop.toLowerCase();
    const crop = CROP_DATA[cropKey];

    if (!crop) {
        return res.status(404).json({
            success: false,
            error: `Crop '${req.params.crop}' not found`,
            availableCrops: Object.keys(CROP_DATA)
        });
    }

    const avg7day = calculateAverage(crop.prices7day);
    const avg30day = calculateAverage(crop.prices30day);
    const change7d = calculatePriceChange(crop.prices7day);
    const change30d = calculatePriceChange(crop.prices30day);

    res.json({
        success: true,
        data: {
            ...crop,
            statistics: {
                avg7day,
                avg30day,
                change7d,
                change30d,
                min7day: Math.min(...crop.prices7day),
                max7day: Math.max(...crop.prices7day),
                min30day: Math.min(...crop.prices30day),
                max30day: Math.max(...crop.prices30day)
            }
        },
        timestamp: Date.now()
    });
});

/**
 * GET /api/crops/analysis/:crop
 * Get selling recommendation for a specific crop
 */
router.get('/analysis/:crop', async (req, res) => {
    const cropKey = req.params.crop.toLowerCase();
    const crop = CROP_DATA[cropKey];

    if (!crop) {
        return res.status(404).json({
            success: false,
            error: `Crop '${req.params.crop}' not found`,
            availableCrops: Object.keys(CROP_DATA)
        });
    }

    const analysis = generateSellingAnalysis(crop);

    res.json({
        success: true,
        data: {
            crop: crop.name,
            currentPrice: crop.currentPrice,
            unit: crop.unit,
            analysis,
            timestamp: Date.now()
        }
    });
});

/**
 * Calculate average price
 */
function calculateAverage(prices) {
    return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

/**
 * Calculate price change percentage
 */
function calculatePriceChange(prices) {
    if (prices.length < 2) return 0;
    const oldest = prices[0];
    const newest = prices[prices.length - 1];
    return parseFloat(((newest - oldest) / oldest * 100).toFixed(2));
}

/**
 * Generate selling analysis and recommendation
 */
function generateSellingAnalysis(crop) {
    const currentPrice = crop.currentPrice;
    const avg7day = calculateAverage(crop.prices7day);
    const avg30day = calculateAverage(crop.prices30day);
    const change7d = calculatePriceChange(crop.prices7day);

    let recommendation = '';
    let confidence = '';
    let reasons = [];
    let action = '';

    // Determine recommendation based on multiple factors
    const aboveAvg7d = currentPrice > avg7day;
    const aboveAvg30d = currentPrice > avg30day;
    const aboveMSP = crop.msp ? currentPrice > crop.msp : true;
    const priceRising = change7d > 0;
    const priceRisingFast = change7d > 3;
    const priceFalling = change7d < -2;

    if (aboveAvg7d && aboveAvg30d && aboveMSP) {
        if (priceRisingFast) {
            recommendation = 'WAIT';
            confidence = 'Medium';
            action = 'Hold for a few more days';
            reasons = [
                `Price is rising rapidly (+${change7d}% in 7 days)`,
                'May get better prices soon',
                'But be ready to sell if trend reverses'
            ];
        } else if (priceFalling) {
            recommendation = 'SELL NOW';
            confidence = 'High';
            action = 'Sell immediately';
            reasons = [
                'Price is above both 7-day and 30-day averages',
                `But trending downward (${change7d}% in 7 days)`,
                'Better to lock in current gains'
            ];
        } else {
            recommendation = 'GOOD TIME TO SELL';
            confidence = 'High';
            action = 'Recommended to sell';
            reasons = [
                `Price (₹${currentPrice}) is above 7-day average (₹${avg7day})`,
                `Price is above 30-day average (₹${avg30day})`,
                crop.msp ? `Price is well above MSP (₹${crop.msp})` : null,
                'Market conditions are favorable'
            ].filter(Boolean);
        }
    } else if (aboveAvg7d && !aboveAvg30d) {
        recommendation = 'AVERAGE TIME';
        confidence = 'Medium';
        action = 'Can sell if storage is a concern';
        reasons = [
            `Price is above recent average (₹${avg7day})`,
            `But below 30-day average (₹${avg30day})`,
            'May wait for better prices if storage is not an issue'
        ];
    } else if (!aboveAvg7d && priceRisingFast) {
        recommendation = 'WAIT';
        confidence = 'Medium';
        action = 'Wait for prices to improve';
        reasons = [
            `Current price (₹${currentPrice}) is below average`,
            `But prices are rising (+${change7d}% in 7 days)`,
            'May get better rates in coming days'
        ];
    } else if (!aboveMSP && crop.msp) {
        recommendation = 'WAIT OR SELL TO GOVT';
        confidence = 'High';
        action = 'Consider selling to government at MSP';
        reasons = [
            `Market price (₹${currentPrice}) is below MSP (₹${crop.msp})`,
            'Government will buy at MSP if available',
            'Check local procurement centers'
        ];
    } else {
        recommendation = 'WAIT';
        confidence = 'Medium';
        action = 'Hold if possible';
        reasons = [
            `Current price (₹${currentPrice}) is below averages`,
            'Market conditions may improve',
            'Consider storage costs in your decision'
        ];
    }

    // Add storage advice
    const storageAdvice = getStorageAdvice(crop);

    return {
        recommendation,
        confidence,
        action,
        reasons,
        priceComparison: {
            vs7dayAvg: {
                value: avg7day,
                diff: currentPrice - avg7day,
                percent: parseFloat(((currentPrice - avg7day) / avg7day * 100).toFixed(2))
            },
            vs30dayAvg: {
                value: avg30day,
                diff: currentPrice - avg30day,
                percent: parseFloat(((currentPrice - avg30day) / avg30day * 100).toFixed(2))
            },
            vsMSP: crop.msp ? {
                value: crop.msp,
                diff: currentPrice - crop.msp,
                percent: parseFloat(((currentPrice - crop.msp) / crop.msp * 100).toFixed(2))
            } : null
        },
        trend: {
            direction: change7d > 0 ? 'up' : change7d < 0 ? 'down' : 'stable',
            change7d,
            description: change7d > 2 ? 'Rising' : change7d < -2 ? 'Falling' : 'Stable'
        },
        storageAdvice,
        markets: crop.majorMarkets
    };
}

/**
 * Get storage advice based on crop type
 */
function getStorageAdvice(crop) {
    const advice = {
        paddy: 'Store in dry, well-ventilated godown. Moisture should be below 14%.',
        rice: 'Keep in moisture-proof containers. Check for insects regularly.',
        wheat: 'Store in cool, dry place. Use airtight containers to prevent pest attack.',
        maize: 'Dry properly before storage. Moisture should be below 12%.',
        cotton: 'Store in covered area away from moisture. Avoid direct ground contact.',
        soybean: 'Keep moisture below 10%. Store in well-aerated godowns.',
        groundnut: 'Store in gunny bags in cool, dry place. Check for aflatoxin.',
        sugarcane: 'Sell within 24-48 hours of harvest for best sugar recovery.'
    };

    const cropKey = Object.keys(CROP_DATA).find(key => CROP_DATA[key] === crop);
    return advice[cropKey] || 'Store in cool, dry conditions. Consult local agricultural officer.';
}

module.exports = router;
