const express = require('express');
const { supabase } = require('./supabase');

const router = express.Router();

// Check if user has preferences
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data, exists: !!data });

  } catch (error) {
    console.error('Check preferences error:', error);
    res.status(500).json({ error: 'Failed to check preferences' });
  }
});

// Save user preferences
router.post('/save', async (req, res) => {
  try {
    const { user_id, monthly_income, savings_target, emergency_fund } = req.body;

    console.log('Saving preferences:', { user_id, monthly_income, savings_target, emergency_fund });

    if (!user_id || !monthly_income || !savings_target || !emergency_fund) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, monthly_income, savings_target, emergency_fund' 
      });
    }

    // Upsert preferences (insert or update if exists)
    const { data, error } = await supabase
      .from('preferences')
      .upsert({
        user_id,
        monthly_income: parseFloat(monthly_income),
        monthly_savings_target: parseFloat(savings_target),
        emergency_fund_target: parseFloat(emergency_fund),
      }, {
        onConflict: 'user_id' // uses 'user_id' column to check duplicates
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Preferences saved:', data);
    res.json({ success: true, data: data[0] });

  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

module.exports = router;
