const express = require('express');
const { supabase } = require('./supabase');

const router = express.Router();

// Send OTP to phone number
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ 
        error: 'Phone number is required' 
      });
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to send OTP' 
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, token } = req.body;

    if (!phone || !token) {
      return res.status(400).json({ 
        error: 'Phone number and token are required' 
      });
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      session: data.session,
      user: data.user 
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to verify OTP' 
    });
  }
});

// Get current session
router.get('/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      user: data.user 
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(401).json({ 
      error: error.message || 'Invalid session' 
    });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      throw error;
    }

    res.json({ 
      success: true, 
      message: 'Signed out successfully' 
    });

  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to sign out' 
    });
  }
});

module.exports = router;