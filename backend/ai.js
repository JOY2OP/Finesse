const express = require('express');
const { GoogleGenAI  } = require('@google/genai');
const { supabase } = require('./supabase');
require('dotenv').config();
const router = express.Router();

const apikey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({apikey});

router.get('/lastMonth', async (req, res) => {
    try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: "Explain how AI works in a few words",
    });
    console.log(response.text);
    res.json({ success: true, data: response.text });

    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch AI response', details: err.message });
    }
});

router.get('/thisWeek', async(req,res) => {
    res.json({ success: true, message: 'This week endpoint' });
});

module.exports = router;
