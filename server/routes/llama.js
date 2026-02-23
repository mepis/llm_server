/**
 * Llama Routes
 * API routes for llama.cpp management
 */

import express from 'express';
import * as llamaController from '../controllers/llamaController.js';

const router = express.Router();

// Llama.cpp management routes
router.post('/clone', llamaController.cloneLlama);
router.post('/build', llamaController.buildLlama);
router.get('/build/:buildId', llamaController.getBuildStatus);
router.get('/build/:buildId/output', llamaController.getBuildOutput);
router.get('/builds/active', llamaController.getActiveBuilds);
router.get('/builds/history', llamaController.getBuildHistory);
router.delete('/build/:buildId', llamaController.killBuild);

export default router;
