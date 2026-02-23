/**
 * Shared server-side constants
 */

export const MANAGED_SERVICES = ['llama-server', 'llm-frontend', 'llm-updater'];

export const VALID_BUILD_TYPES = ['cpu', 'cuda', 'rocm', 'auto'];

export const BUILD_STATUSES = {
  SUCCESS: 'success',
  FAILED: 'failed',
  RUNNING: 'running',
  PENDING: 'pending'
};
