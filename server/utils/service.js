/**
 * Service Management Utilities
 * Manages systemd services
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a service exists
 * @param {string} serviceName - Service name
 * @returns {boolean} Exists
 */
export async function serviceExists(serviceName) {
  try {
    await execAsync(`systemctl list-unit-files ${serviceName}.service`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get service status
 * @param {string} serviceName - Service name
 * @returns {Object} Status info
 */
export async function getServiceStatus(serviceName) {
  try {
    const { stdout } = await execAsync(`systemctl is-active ${serviceName}`);
    const active = stdout.trim() === 'active';

    const { stdout: enabledOut } = await execAsync(`systemctl is-enabled ${serviceName}`);
    const enabled = enabledOut.trim() === 'enabled';

    let pid = null;
    try {
      const { stdout: pidOut } = await execAsync(`systemctl show -p MainPID ${serviceName}`);
      pid = parseInt(pidOut.split('=')[1]);
    } catch (e) {
      // Ignore
    }

    return {
      name: serviceName,
      active,
      enabled,
      pid: pid || null,
      status: active ? 'running' : 'stopped'
    };
  } catch (error) {
    return {
      name: serviceName,
      active: false,
      enabled: false,
      pid: null,
      status: 'not-installed'
    };
  }
}

/**
 * Start a service
 * @param {string} serviceName - Service name
 * @returns {Object} Result
 */
export async function startService(serviceName) {
  try {
    await execAsync(`systemctl start ${serviceName}`);
    return { success: true, message: `Service ${serviceName} started` };
  } catch (error) {
    throw new Error(`Failed to start service: ${error.message}`);
  }
}

/**
 * Stop a service
 * @param {string} serviceName - Service name
 * @returns {Object} Result
 */
export async function stopService(serviceName) {
  try {
    await execAsync(`systemctl stop ${serviceName}`);
    return { success: true, message: `Service ${serviceName} stopped` };
  } catch (error) {
    throw new Error(`Failed to stop service: ${error.message}`);
  }
}

/**
 * Restart a service
 * @param {string} serviceName - Service name
 * @returns {Object} Result
 */
export async function restartService(serviceName) {
  try {
    await execAsync(`systemctl restart ${serviceName}`);
    return { success: true, message: `Service ${serviceName} restarted` };
  } catch (error) {
    throw new Error(`Failed to restart service: ${error.message}`);
  }
}

/**
 * Enable a service
 * @param {string} serviceName - Service name
 * @returns {Object} Result
 */
export async function enableService(serviceName) {
  try {
    await execAsync(`systemctl enable ${serviceName}`);
    return { success: true, message: `Service ${serviceName} enabled` };
  } catch (error) {
    throw new Error(`Failed to enable service: ${error.message}`);
  }
}

/**
 * Disable a service
 * @param {string} serviceName - Service name
 * @returns {Object} Result
 */
export async function disableService(serviceName) {
  try {
    await execAsync(`systemctl disable ${serviceName}`);
    return { success: true, message: `Service ${serviceName} disabled` };
  } catch (error) {
    throw new Error(`Failed to disable service: ${error.message}`);
  }
}

/**
 * Get service logs
 * @param {string} serviceName - Service name
 * @param {number} lines - Number of lines
 * @returns {string} Logs
 */
export async function getServiceLogs(serviceName, lines = 100) {
  try {
    const { stdout } = await execAsync(`journalctl -u ${serviceName} -n ${lines} --no-pager`);
    return stdout;
  } catch (error) {
    throw new Error(`Failed to get logs: ${error.message}`);
  }
}
