const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /chat - Generate AI response
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Use Gemini Pro model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `You are AgriBot, an intelligent agricultural assistant. 
        Your goal is to provide helpful, accurate, and concise advice to farmers and users about crops, soil, market prices, and weather.
        
        User Query: ${message}
        
        Keep your response professional but friendly. Use formatting like bullet points if listing items.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error('Error generating AI response:', error);
        res.status(500).json({
            error: 'Failed to generate response',
            details: error.message
        });
    }
});

module.exports = router;
