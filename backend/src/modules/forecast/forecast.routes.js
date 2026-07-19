const express = require('express');
const { createForecast } = require('./forecast.controller');

const router = express.Router();

router.post('/', createForecast);

module.exports = router;
