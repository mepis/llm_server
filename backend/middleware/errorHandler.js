/**
 * errorHandler description.
 * @param {...} args - Description of parameters.
 * @returns {any} Description of return value.
 */

/**
 * errorHandler description.
 * @param {...} args - Description of parameters.
 * @returns {any} Description of return value.
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    error: message
  });
};

/**
 * logger description.
 * @param {...} args - Description of parameters.
 * @returns {any} Description of return value.
 */

/**
 * logger description.
 * @param {...} args - Description of parameters.
 * @returns {any} Description of return value.
 */

const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path}`);
  next();
};

module.exports = {
  errorHandler,
  logger
};


