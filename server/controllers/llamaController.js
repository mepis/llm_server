/**
 * Llama Controller
 * Handles llama.cpp build and management
 */

import path from 'path';
import { fileURLToPath } from 'url';
import * as scriptRunner from '../services/scriptRunner.js';
import * as system from '../utils/system.js';
import db from '../models/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPT_DIR = path.join(__dirname, '../../scripts');

/**
 * Clone llama.cpp repository
 */
export async function cloneLlama(req, res, next) {
  try {
    const scriptPath = path.join(SCRIPT_DIR, 'llama/clone-llama.sh');

    const buildInfo = scriptRunner.runScript(scriptPath, [], {
      onComplete: async (code, info) => {
        // Log to database
        await db.run(
          'INSERT INTO build_history (build_type, status, log_output, started_at, completed_at) VALUES (?, ?, ?, ?, ?)',
          ['clone', code === 0 ? 'success' : 'failed', JSON.stringify(info.output), new Date(info.startTime).toISOString(), new Date(info.endTime).toISOString()]
        );
      }
    });

    res.json({
      success: true,
      data: {
        buildId: buildInfo.id,
        status: 'started',
        message: 'Cloning llama.cpp repository'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Build llama.cpp
 */
export async function buildLlama(req, res, next) {
  try {
    const { buildType } = req.body;

    // Validate build type
    const validTypes = ['cpu', 'cuda', 'rocm', 'auto'];
    if (!validTypes.includes(buildType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid build type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Auto-detect build type if requested
    let selectedType = buildType;
    if (buildType === 'auto') {
      selectedType = await system.getRecommendedBuildType();
    }

    const scriptPath = path.join(SCRIPT_DIR, `llama/build-${selectedType}.sh`);

    const buildInfo = scriptRunner.runScript(scriptPath, [], {
      onComplete: async (code, info) => {
        // Log to database
        await db.run(
          'INSERT INTO build_history (build_type, status, log_output, started_at, completed_at) VALUES (?, ?, ?, ?, ?)',
          [selectedType, code === 0 ? 'success' : 'failed', JSON.stringify(info.output), new Date(info.startTime).toISOString(), new Date(info.endTime).toISOString()]
        );
      }
    });

    res.json({
      success: true,
      data: {
        buildId: buildInfo.id,
        buildType: selectedType,
        status: 'started',
        message: `Building llama.cpp for ${selectedType}`
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get build status
 */
export function getBuildStatus(req, res, next) {
  try {
    const { buildId } = req.params;
    const id = parseInt(buildId);

    const buildInfo = scriptRunner.getBuildInfo(id);

    if (!buildInfo) {
      return res.status(404).json({
        success: false,
        error: 'Build not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: buildInfo.id,
        scriptPath: buildInfo.scriptPath,
        status: buildInfo.status,
        startTime: buildInfo.startTime,
        endTime: buildInfo.endTime,
        exitCode: buildInfo.exitCode,
        error: buildInfo.error
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get build output
 */
export function getBuildOutput(req, res, next) {
  try {
    const { buildId } = req.params;
    const { fromIndex = 0 } = req.query;
    const id = parseInt(buildId);

    const output = scriptRunner.getBuildOutput(id, parseInt(fromIndex));

    if (output === null) {
      return res.status(404).json({
        success: false,
        error: 'Build not found'
      });
    }

    res.json({
      success: true,
      data: {
        buildId: id,
        output,
        totalLines: output.length + parseInt(fromIndex)
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all active builds
 */
export function getActiveBuilds(req, res, next) {
  try {
    const builds = scriptRunner.getActiveBuilds();

    res.json({
      success: true,
      data: builds
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get build history
 */
export async function getBuildHistory(req, res, next) {
  try {
    const { limit = 50 } = req.query;

    const history = db.all(
      'SELECT * FROM build_history ORDER BY started_at DESC LIMIT ?',
      [parseInt(limit)]
    );

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Kill a running build
 */
export function killBuild(req, res, next) {
  try {
    const { buildId } = req.params;
    const id = parseInt(buildId);

    const success = scriptRunner.killBuild(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Build not found or already completed'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Build killed successfully'
      }
    });
  } catch (error) {
    next(error);
  }
}
