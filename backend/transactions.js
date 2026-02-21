const express = require('express');
const { supabase } = require('./supabase');

const router = express.Router();

// Add transaction
router.post('/add', async (req, res) => {
  try {
    const { user_id, amount, category, note, occured_at } = req.body;

    console.log('Adding transaction:', { user_id, amount, category, note, occured_at });

    // Validate required fields
    if (!user_id || !amount || !category || !occured_at) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, amount, category, occured_at' 
      });
    }

    // Insert transaction using service role key (bypasses RLS)
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id,
        amount: parseFloat(amount),
        category,
        note: note || null,
        occured_at,
      }])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Transaction inserted:', data);
    res.json({ success: true, data: data[0] });

  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

module.exports = router;
