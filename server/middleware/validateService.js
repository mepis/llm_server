/**
 * Middleware to validate :serviceName route parameter
 */

import { MANAGED_SERVICES } from '../constants.js';

export function validateService(req, res, next) {
  const { serviceName } = req.params;

  if (!MANAGED_SERVICES.includes(serviceName)) {
    return res.status(400).json({
      success: false,
      error: `Invalid service name. Must be one of: ${MANAGED_SERVICES.join(', ')}`
    });
  }

  next();
}
