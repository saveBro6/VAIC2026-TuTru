const visitsService = require('./visits.service');

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
  getPathway,
};
