/**
 * ============================================
 * Weather API Routes
 * ============================================
 * 
 * Provides weather data for farming decisions
 * Uses WeatherAPI.com for real-time data
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Default location (can be overridden by query params)
const DEFAULT_LOCATION = 'Hyderabad,India';

/**
 * GET /api/weather/current
 * Get current weather conditions
 */
router.get('/current', async (req, res) => {
    try {
        const location = req.query.location || DEFAULT_LOCATION;

        if (!process.env.WEATHER_API_KEY) {
            // Return demo data if no API key
            return res.json({
                success: true,
                source: 'demo',
                data: getDemoWeather()
            });
        }

        const response = await axios.get(
            `https://api.weatherapi.com/v1/current.json`,
            {
                params: {
                    key: process.env.WEATHER_API_KEY,
                    q: location,
                    aqi: 'no'
                }
            }
        );

        const weather = response.data;

        res.json({
            success: true,
            source: 'live',
            data: {
                location: {
                    name: weather.location.name,
                    region: weather.location.region,
                    country: weather.location.country
                },
                current: {
                    temp_c: weather.current.temp_c,
                    condition: weather.current.condition.text,
                    icon: weather.current.condition.icon,
                    humidity: weather.current.humidity,
                    wind_kph: weather.current.wind_kph,
                    wind_dir: weather.current.wind_dir,
                    precip_mm: weather.current.precip_mm,
                    feels_like_c: weather.current.feelslike_c,
                    uv: weather.current.uv,
                    cloud: weather.current.cloud,
                    is_day: weather.current.is_day
                },
                updated: weather.current.last_updated
            }
        });

    } catch (error) {
        console.error('Weather API Error:', error.message);

        // Fallback to demo data on error
        res.json({
            success: true,
            source: 'demo',
            data: getDemoWeather(),
            warning: 'Using demo data due to API error'
        });
    }
});

/**
 * GET /api/weather/forecast
 * Get weather forecast for next 3 days
 */
router.get('/forecast', async (req, res) => {
    try {
        const location = req.query.location || DEFAULT_LOCATION;
        const days = Math.min(parseInt(req.query.days) || 3, 3);

        if (!process.env.WEATHER_API_KEY) {
            return res.json({
                success: true,
                source: 'demo',
                data: getDemoForecast()
            });
        }

        const response = await axios.get(
            `https://api.weatherapi.com/v1/forecast.json`,
            {
                params: {
                    key: process.env.WEATHER_API_KEY,
                    q: location,
                    days: days,
                    aqi: 'no',
                    alerts: 'yes'
                }
            }
        );

        const forecast = response.data;

        // Check for rain in forecast
        const rainExpected = forecast.forecast.forecastday.some(day =>
            day.day.daily_chance_of_rain > 50 || day.day.totalprecip_mm > 5
        );

        res.json({
            success: true,
            source: 'live',
            data: {
                location: {
                    name: forecast.location.name,
                    region: forecast.location.region
                },
                forecast: forecast.forecast.forecastday.map(day => ({
                    date: day.date,
                    temp_max_c: day.day.maxtemp_c,
                    temp_min_c: day.day.mintemp_c,
                    condition: day.day.condition.text,
                    icon: day.day.condition.icon,
                    rain_chance: day.day.daily_chance_of_rain,
                    precip_mm: day.day.totalprecip_mm,
                    humidity: day.day.avghumidity,
                    uv: day.day.uv
                })),
                alerts: forecast.alerts?.alert || [],
                rainExpected,
                farmingAdvice: generateFarmingAdvice(forecast.forecast.forecastday)
            }
        });

    } catch (error) {
        console.error('Forecast API Error:', error.message);

        res.json({
            success: true,
            source: 'demo',
            data: getDemoForecast(),
            warning: 'Using demo data due to API error'
        });
    }
});

/**
 * Generate farming advice based on weather
 */
function generateFarmingAdvice(forecastDays) {
    const advice = [];

    forecastDays.forEach((day, index) => {
        const dayName = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : day.date;

        if (day.day.daily_chance_of_rain > 70) {
            advice.push({
                type: 'warning',
                day: dayName,
                message: `Heavy rain expected (${day.day.daily_chance_of_rain}% chance). Avoid harvesting and ensure proper drainage.`
            });
        } else if (day.day.daily_chance_of_rain > 40) {
            advice.push({
                type: 'caution',
                day: dayName,
                message: `Light rain possible (${day.day.daily_chance_of_rain}% chance). Plan outdoor activities accordingly.`
            });
        }

        if (day.day.maxtemp_c > 40) {
            advice.push({
                type: 'warning',
                day: dayName,
                message: `Extreme heat expected (${day.day.maxtemp_c}°C). Ensure adequate irrigation and avoid midday work.`
            });
        }

        if (day.day.uv > 8) {
            advice.push({
                type: 'caution',
                day: dayName,
                message: `High UV index (${day.day.uv}). Protect yourself and tender crops from sun damage.`
            });
        }
    });

    if (advice.length === 0) {
        advice.push({
            type: 'good',
            day: 'Overall',
            message: 'Weather conditions look favorable for farming activities.'
        });
    }

    return advice;
}

/**
 * Demo weather data for testing
 */
function getDemoWeather() {
    return {
        location: {
            name: 'Hyderabad',
            region: 'Telangana',
            country: 'India'
        },
        current: {
            temp_c: 32,
            condition: 'Partly Cloudy',
            icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
            humidity: 65,
            wind_kph: 12,
            wind_dir: 'SE',
            precip_mm: 0,
            feels_like_c: 35,
            uv: 7,
            cloud: 40,
            is_day: 1
        },
        updated: new Date().toISOString()
    };
}

/**
 * Demo forecast data for testing
 */
function getDemoForecast() {
    const today = new Date();

    return {
        location: {
            name: 'Hyderabad',
            region: 'Telangana'
        },
        forecast: [
            {
                date: today.toISOString().split('T')[0],
                temp_max_c: 34,
                temp_min_c: 24,
                condition: 'Partly Cloudy',
                icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
                rain_chance: 20,
                precip_mm: 0,
                humidity: 60,
                uv: 7
            },
            {
                date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
                temp_max_c: 33,
                temp_min_c: 23,
                condition: 'Thundery outbreaks possible',
                icon: '//cdn.weatherapi.com/weather/64x64/day/200.png',
                rain_chance: 60,
                precip_mm: 8,
                humidity: 70,
                uv: 5
            },
            {
                date: new Date(today.getTime() + 172800000).toISOString().split('T')[0],
                temp_max_c: 30,
                temp_min_c: 22,
                condition: 'Light rain',
                icon: '//cdn.weatherapi.com/weather/64x64/day/296.png',
                rain_chance: 75,
                precip_mm: 12,
                humidity: 80,
                uv: 4
            }
        ],
        alerts: [],
        rainExpected: true,
        farmingAdvice: [
            {
                type: 'warning',
                day: 'Tomorrow',
                message: 'Rain expected (60% chance). Consider completing harvest today if possible.'
            },
            {
                type: 'warning',
                day: 'Day after tomorrow',
                message: 'Heavy rain expected (75% chance). Avoid harvesting and ensure proper storage.'
            }
        ]
    };
}

module.exports = router;
