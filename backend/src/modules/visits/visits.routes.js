const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const { getCurrentPathway, getPathway } = require('./visits.controller');

const router = express.Router();

router.get('/current/pathway', authenticate, getCurrentPathway);
router.get('/:visitId/pathway', getPathway);

module.exports = router;
