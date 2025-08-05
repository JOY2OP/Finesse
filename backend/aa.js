const express = require('express');
const router = express.Router();

router.get('/webview', async (req,res)=>{
    // console.log('hello from view');
    res.json('aa-endpoint')
})

module.exports = router; //so it could be used in other files