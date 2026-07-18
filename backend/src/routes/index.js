const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const healthRoutes = require('../modules/health/health.routes');
const routingRoutes = require('../modules/routing/routing.routes');
const symptomRoutingRoutes = require('../modules/symptom-routing/symptom-routing.routes');
const visitsRoutes = require('../modules/visits/visits.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/routing', routingRoutes);
router.use('/symptom-routing', symptomRoutingRoutes);
router.use('/visits', visitsRoutes);

module.exports = router;
