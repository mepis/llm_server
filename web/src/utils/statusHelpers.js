/**
 * Shared status class and badge helpers
 */

import { THRESHOLDS } from '../config/constants.js';

/**
 * Returns a CSS class name based on a percentage value.
 * @param {number} percentage
 * @returns {'normal'|'medium'|'high'}
 */
export function getUsageStatusClass(percentage) {
  if (percentage > THRESHOLDS.HIGH) return 'high';
  if (percentage > THRESHOLDS.MEDIUM) return 'medium';
  return 'normal';
}

/**
 * Maps a build status string to a badge CSS class.
 * @param {string} status
 * @returns {string}
 */
export function getBuildStatusBadge(status) {
  const badges = {
    completed: 'badge-success',
    failed: 'badge-error',
    running: 'badge-info',
    pending: 'badge-warning'
  };
  return badges[status] || 'badge-info';
}

/**
 * Maps a service status string to a badge CSS class.
 * @param {string} status
 * @returns {string}
 */
export function getServiceStatusBadge(status) {
  const badges = {
    running: 'badge-success',
    stopped: 'badge-error',
    failed: 'badge-error',
    inactive: 'badge-warning'
  };
  return badges[status] || 'badge-info';
}
