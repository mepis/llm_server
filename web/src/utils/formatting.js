/**
 * Shared formatting utilities
 */

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
