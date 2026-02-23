/**
 * Service Controller
 * Handles systemd service management
 */

import * as service from '../utils/service.js';
import db from '../models/database.js';

const MANAGED_SERVICES = ['llama-server', 'llm-frontend', 'llm-updater'];

/**
 * Get status of all managed services
 */
export async function getAllStatus(req, res, next) {
  try {
    const statuses = await Promise.all(
      MANAGED_SERVICES.map(name => service.getServiceStatus(name))
    );

    // Update database
    for (const status of statuses) {
      await db.run(
        'INSERT OR REPLACE INTO service_status (service_name, status, pid, last_check) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [status.name, status.status, status.pid]
      );
    }

    res.json({
      success: true,
      data: statuses
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get service status
 */
export async function getStatus(req, res, next) {
  try {
    const { serviceName } = req.params;

    if (!MANAGED_SERVICES.includes(serviceName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name'
      });
    }

    const status = await service.getServiceStatus(serviceName);

    // Update database
    await db.run(
      'INSERT OR REPLACE INTO service_status (service_name, status, pid, last_check) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [status.name, status.status, status.pid]
    );

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Start service
 */
export async function start(req, res, next) {
  try {
    const { serviceName } = req.params;

    if (!MANAGED_SERVICES.includes(serviceName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name'
      });
    }

    const result = await service.startService(serviceName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Stop service
 */
export async function stop(req, res, next) {
  try {
    const { serviceName } = req.params;

    if (!MANAGED_SERVICES.includes(serviceName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name'
      });
    }

    const result = await service.stopService(serviceName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Restart service
 */
export async function restart(req, res, next) {
  try {
    const { serviceName } = req.params;

    if (!MANAGED_SERVICES.includes(serviceName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name'
      });
    }

    const result = await service.restartService(serviceName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Enable service
 */
export async function enable(req, res, next) {
  try {
    const { serviceName } = req.params;

    if (!MANAGED_SERVICES.includes(serviceName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name'
      });
    }

    const result = await service.enableService(serviceName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Disable service
 */
export async function disable(req, res, next) {
  try {
    const { serviceName } = req.params;

    if (!MANAGED_SERVICES.includes(serviceName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name'
      });
    }

    const result = await service.disableService(serviceName);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get service logs
 */
export async function logs(req, res, next) {
  try {
    const { serviceName } = req.params;
    const { lines = 100 } = req.query;

    if (!MANAGED_SERVICES.includes(serviceName)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service name'
      });
    }

    const logOutput = await service.getServiceLogs(serviceName, parseInt(lines));

    res.json({
      success: true,
      data: {
        service: serviceName,
        logs: logOutput
      }
    });
  } catch (error) {
    next(error);
  }
}
