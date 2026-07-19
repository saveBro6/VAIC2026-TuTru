const express = require('express');
const { authenticate } = require('../../middlewares/auth');
const doctorController = require('./doctor.controller');

const router = express.Router();

router.use(authenticate);

router.get('/queue', doctorController.getQueue);
router.get('/clinical-specialties', doctorController.getClinicalSpecialties);
router.patch('/queue/:entryId/status', doctorController.updateQueueStatus);
router.post('/queue/:entryId/prescriptions', doctorController.prescribeAndStartExam);
router.get('/visits/:visitId', doctorController.getVisit);
router.patch('/visits/:visitId/priority', doctorController.updatePriority);
router.post('/visits/:visitId/start', doctorController.startVisit);
router.post('/visits/:visitId/complete', doctorController.completeVisit);
router.post('/visits/:visitId/orders', doctorController.createOrders);

module.exports = router;
