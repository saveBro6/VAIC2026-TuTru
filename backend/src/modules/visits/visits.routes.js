const express = require('express');
const { getPathway } = require('./visits.controller');

const router = express.Router();

router.get('/:visitId/pathway', getPathway);

module.exports = router;
