/**
 * System Controller
 * Handles system information and metrics requests
 */

import * as system from '../utils/system.js';

/**
 * Get system information
 */
export async function getInfo(req, res, next) {
  try {
    const info = await system.getSystemInfo();

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current system metrics
 */
export async function getMetrics(req, res, next) {
  try {
    const metrics = await system.getSystemMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get CPU information
 */
export async function getCPU(req, res, next) {
  try {
    const cpu = await system.getCPUInfo();

    res.json({
      success: true,
      data: cpu
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get memory information
 */
export function getMemory(req, res, next) {
  try {
    const memory = system.getMemoryInfo();

    res.json({
      success: true,
      data: memory
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get GPU information
 */
export async function getGPU(req, res, next) {
  try {
    const gpu = await system.getGPUInfo();

    res.json({
      success: true,
      data: gpu
    });
  } catch (error) {
    next(error);
  }
}
