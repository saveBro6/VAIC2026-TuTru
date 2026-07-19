const forecastService = require('./forecast.service');

const createForecast = async (req, res, next) => {
  try {
    const result = await forecastService.createForecast(req.body);
    res.status(result.statusCode).json(result.data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createForecast
};
