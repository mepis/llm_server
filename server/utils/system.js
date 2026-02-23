/**
 * System Utilities
 * Hardware detection and system information
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Get CPU information
 * @returns {Object} CPU info
 */
export async function getCPUInfo() {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();

  return {
    model: cpus[0]?.model || 'Unknown',
    cores: cpus.length,
    architecture: os.arch(),
    loadAverage: {
      '1min': loadAvg[0],
      '5min': loadAvg[1],
      '15min': loadAvg[2]
    },
    usage: await getCPUUsage()
  };
}

/**
 * Get CPU usage percentage
 * @returns {number} CPU usage percentage
 */
async function getCPUUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - (100 * idle / total);

  return Math.round(usage * 100) / 100;
}

/**
 * Get memory information
 * @returns {Object} Memory info
 */
export function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    total: total,
    free: free,
    used: used,
    usagePercent: Math.round((used / total) * 10000) / 100,
    totalGB: Math.round(total / 1024 / 1024 / 1024 * 100) / 100,
    usedGB: Math.round(used / 1024 / 1024 / 1024 * 100) / 100,
    freeGB: Math.round(free / 1024 / 1024 / 1024 * 100) / 100
  };
}

/**
 * Detect NVIDIA GPU
 * @returns {Object|null} GPU info or null
 */
export async function detectNvidiaGPU() {
  try {
    // Check if nvidia-smi is available
    const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader,nounits 2>/dev/null');

    if (!stdout.trim()) {
      return null;
    }

    const lines = stdout.trim().split('\n');
    const gpus = lines.map(line => {
      const [name, memoryMB, driver] = line.split(',').map(s => s.trim());
      return {
        name,
        memoryMB: parseInt(memoryMB),
        memoryGB: Math.round(parseInt(memoryMB) / 1024 * 100) / 100,
        driver
      };
    });

    return {
      type: 'nvidia',
      count: gpus.length,
      gpus
    };
  } catch (error) {
    return null;
  }
}

/**
 * Detect AMD GPU
 * @returns {Object|null} GPU info or null
 */
export async function detectAMDGPU() {
  try {
    // Check if ROCm is available
    const { stdout } = await execAsync('rocm-smi --showproductname 2>/dev/null');

    if (!stdout.trim()) {
      return null;
    }

    return {
      type: 'amd',
      rocm: true,
      info: stdout.trim()
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get GPU information
 * @returns {Object} GPU info
 */
export async function getGPUInfo() {
  // Try NVIDIA first
  const nvidiaGPU = await detectNvidiaGPU();
  if (nvidiaGPU) {
    // Check for CUDA
    try {
      const { stdout } = await execAsync('nvcc --version 2>/dev/null');
      const cudaMatch = stdout.match(/release (\d+\.\d+)/);
      nvidiaGPU.cuda = cudaMatch ? cudaMatch[1] : null;
    } catch (error) {
      nvidiaGPU.cuda = null;
    }
    return nvidiaGPU;
  }

  // Try AMD
  const amdGPU = await detectAMDGPU();
  if (amdGPU) {
    return amdGPU;
  }

  // No GPU detected
  return {
    type: 'none',
    message: 'No GPU detected'
  };
}

/**
 * Get recommended build type
 * @returns {string} Build type: 'cpu', 'cuda', or 'rocm'
 */
export async function getRecommendedBuildType() {
  const gpu = await getGPUInfo();

  if (gpu.type === 'nvidia' && gpu.cuda) {
    return 'cuda';
  }

  if (gpu.type === 'amd') {
    return 'rocm';
  }

  return 'cpu';
}

/**
 * Get complete system information
 * @returns {Object} Complete system info
 */
export async function getSystemInfo() {
  const [cpu, memory, gpu, buildType] = await Promise.all([
    getCPUInfo(),
    getMemoryInfo(),
    getGPUInfo(),
    getRecommendedBuildType()
  ]);

  return {
    platform: os.platform(),
    os: os.type(),
    release: os.release(),
    hostname: os.hostname(),
    uptime: os.uptime(),
    cpu,
    memory,
    gpu,
    recommendedBuildType: buildType
  };
}

/**
 * Get current system metrics (for real-time monitoring)
 * @returns {Object} Current metrics
 */
export async function getSystemMetrics() {
  const cpu = await getCPUInfo();
  const memory = getMemoryInfo();

  const metrics = {
    timestamp: new Date().toISOString(),
    cpu: {
      usage: cpu.usage,
      loadAverage: cpu.loadAverage
    },
    memory: {
      usagePercent: memory.usagePercent,
      usedGB: memory.usedGB,
      totalGB: memory.totalGB
    }
  };

  // Add GPU metrics if available
  try {
    const { stdout } = await execAsync('nvidia-smi --query-gpu=utilization.gpu,utilization.memory,memory.used,memory.total --format=csv,noheader,nounits 2>/dev/null');

    if (stdout.trim()) {
      const [gpuUtil, memUtil, memUsed, memTotal] = stdout.trim().split(',').map(s => parseInt(s.trim()));
      metrics.gpu = {
        utilization: gpuUtil,
        memoryUtilization: memUtil,
        memoryUsedMB: memUsed,
        memoryTotalMB: memTotal
      };
    }
  } catch (error) {
    // GPU metrics not available
  }

  return metrics;
}
