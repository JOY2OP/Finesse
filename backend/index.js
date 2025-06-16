const express = require('express');
const axios = require('axios');
const cors = require('cors');
const OpenAI = require("openai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Finesse Chat Backend is running' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    console.log("incoming-message: ", message); //incoming message

    // if (!message || typeof message !== 'string') {
    //   return res.status(400).json({ 
    //     error: 'Message is required and must be a string' 
    //   });
    // }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured' 
      });
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: req.body.message ,
      model: "gpt-4.1",
      store: true,
    });
  console.log("completion", completion)
  //   console.log("output======",completion.choices[0].message.content);
  // return res.json(completion.choices[0].message.content);

    const reply = completion.choices[0].message.content
    console.log(reply)
    return res.json({ reply });

  } catch (error) {
    console.error('Chat endpoint error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key' 
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to get response from AI assistant' 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Finesse Chat Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/chat`);
});