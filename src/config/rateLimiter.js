const rateLimit = require('express-rate-limit');

const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests from this IP, please try again later.',
    standardHeaders = true,
    legacyHeaders = false
  } = options;
  
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retry_after: Math.ceil(windowMs / 1000)
    },
    standardHeaders,
    legacyHeaders,
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        retry_after: Math.ceil(windowMs / 1000)
      });
    }
  });
};

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please slow down.'
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.'
});

const registrationLimiter = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: 'Too many registration attempts, please try again tomorrow.'
});

module.exports = {
  apiLimiter,
  authLimiter,
  registrationLimiter,
  createRateLimiter
};
