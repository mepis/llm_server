/**
 * Frontend configuration constants
 */

export const POLLING = {
  METRICS: 3000,       // Dashboard system metrics (ms)
  BUILD_OUTPUT: 1000,  // Build log polling (ms)
  SERVICES: 5000       // Service status polling (ms)
};

export const THRESHOLDS = {
  MEDIUM: 50,  // Usage % at which status turns medium/warning
  HIGH: 80     // Usage % at which status turns high/danger
};
