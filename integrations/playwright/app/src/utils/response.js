/**
 * Standardized API response wrapper.
 */
const sendResponse = (
  res,
  statusCode,
  { success, data = null, error = null, message = null },
) => {
  return res.status(statusCode).json({
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { sendResponse };
