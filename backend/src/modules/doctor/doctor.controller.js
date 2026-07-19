const { z } = require('zod');
const doctorService = require('./doctor.service');

const queueStatusSchema = z.object({
  status: z.enum(['WAITING', 'CALLED', 'IN_SERVICE', 'DONE', 'CANCELLED', 'NO_SHOW']),
});

const prioritySchema = z.object({
  priority: z.string().min(1),
});

const getQueue = async (req, res, next) => {
  try {
    const result = await doctorService.getDoctorQueue(req.auth, req.query.room_id || req.query.roomId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updateQueueStatus = async (req, res, next) => {
  try {
    const body = queueStatusSchema.parse(req.body);
    const result = await doctorService.updateQueueEntryStatus(req.auth, req.params.entryId, body.status);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
};

const getVisit = async (req, res, next) => {
  try {
    const result = await doctorService.getDoctorVisit(req.auth, req.params.visitId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const updatePriority = async (req, res, next) => {
  try {
    const body = prioritySchema.parse(req.body);
    const result = await doctorService.updateJourneyPriority(req.auth, req.params.visitId, body.priority);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    next(error);
  }
};

const startVisit = async (req, res, next) => {
  try {
    const result = await doctorService.startVisit(req.auth, req.params.visitId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const completeVisit = async (req, res, next) => {
  try {
    const result = await doctorService.completeVisit(req.auth, req.params.visitId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const createOrders = async (req, res, next) => {
  try {
    const result = await doctorService.createOrders(req.auth, req.params.visitId, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueue,
  updateQueueStatus,
  getVisit,
  updatePriority,
  startVisit,
  completeVisit,
  createOrders,
};
