require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({
      server: 'up',
      database: 'up',
      timestamp: result.rows[0].now,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      server: 'up',
      database: 'down',
      error: error.message
    });
  }
});

module.exports = router;