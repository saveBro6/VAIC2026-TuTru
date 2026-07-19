const visitsService = require('./visits.service');

const getCurrentPathway = async (req, res, next) => {
  try {
    const result = await visitsService.getCurrentPatientPathway(req.auth);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

const getPathway = async (req, res, next) => {
  try {
    const result = await visitsService.getPathway(req.params.visitId);
    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    next(error);
  }
};

module.exports = {
  getCurrentPathway,
  getPathway,
};
