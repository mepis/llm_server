/**
 * Script Runner Service
 * Executes shell scripts and captures output
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store active builds
const activeBuilds = new Map();
let buildIdCounter = 1;

/**
 * Run a script and stream output
 * @param {string} scriptPath - Path to script
 * @param {Array} args - Script arguments
 * @param {Function} onOutput - Output callback
 * @param {Function} onError - Error callback
 * @param {Function} onComplete - Completion callback
 * @returns {Object} Build info
 */
export function runScript(scriptPath, args = [], callbacks = {}) {
  const { onOutput, onError, onComplete } = callbacks;

  const buildId = buildIdCounter++;
  const startTime = Date.now();

  const buildInfo = {
    id: buildId,
    scriptPath,
    args,
    status: 'running',
    output: [],
    error: null,
    startTime,
    endTime: null,
    exitCode: null
  };

  activeBuilds.set(buildId, buildInfo);

  // Spawn process
  const child = spawn('bash', [scriptPath, ...args], {
    cwd: path.join(__dirname, '../..'),
    env: { ...process.env }
  });

  // Capture stdout
  child.stdout.on('data', (data) => {
    const output = data.toString();
    buildInfo.output.push({ type: 'stdout', data: output, timestamp: Date.now() });

    if (onOutput) {
      onOutput(output, 'stdout');
    }
  });

  // Capture stderr
  child.stderr.on('data', (data) => {
    const output = data.toString();
    buildInfo.output.push({ type: 'stderr', data: output, timestamp: Date.now() });

    if (onError) {
      onError(output);
    }
  });

  // Handle completion
  child.on('close', (code) => {
    buildInfo.status = code === 0 ? 'success' : 'failed';
    buildInfo.exitCode = code;
    buildInfo.endTime = Date.now();

    if (onComplete) {
      onComplete(code, buildInfo);
    }

    // Keep build info for 1 hour
    setTimeout(() => {
      activeBuilds.delete(buildId);
    }, 3600000);
  });

  // Handle errors
  child.on('error', (err) => {
    buildInfo.status = 'error';
    buildInfo.error = err.message;
    buildInfo.endTime = Date.now();

    if (onError) {
      onError(err.message);
    }
  });

  buildInfo.process = child;

  return buildInfo;
}

/**
 * Get build info
 * @param {number} buildId - Build ID
 * @returns {Object|null} Build info or null
 */
export function getBuildInfo(buildId) {
  return activeBuilds.get(buildId) || null;
}

/**
 * Get all active builds
 * @returns {Array} Active builds
 */
export function getActiveBuilds() {
  return Array.from(activeBuilds.values()).map(build => ({
    id: build.id,
    scriptPath: build.scriptPath,
    status: build.status,
    startTime: build.startTime,
    endTime: build.endTime
  }));
}

/**
 * Get build output
 * @param {number} buildId - Build ID
 * @param {number} fromIndex - Start index
 * @returns {Array} Output lines
 */
export function getBuildOutput(buildId, fromIndex = 0) {
  const build = activeBuilds.get(buildId);
  if (!build) {
    return null;
  }

  return build.output.slice(fromIndex);
}

/**
 * Kill a running build
 * @param {number} buildId - Build ID
 * @returns {boolean} Success
 */
export function killBuild(buildId) {
  const build = activeBuilds.get(buildId);
  if (!build || !build.process) {
    return false;
  }

  try {
    build.process.kill();
    build.status = 'killed';
    return true;
  } catch (error) {
    return false;
  }
}
