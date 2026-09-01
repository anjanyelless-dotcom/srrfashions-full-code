require('dotenv-flow/config');
const express = require('express');
const router = express.Router();
const { getHomepage } = require('../controllers/homeController');

router.get('/', getHomepage);

module.exports = router;
