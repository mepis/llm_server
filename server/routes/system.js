/**
 * System Routes
 * API routes for system information and monitoring
 */

import express from 'express';
import * as systemController from '../controllers/systemController.js';

const router = express.Router();

// System information routes
router.get('/info', systemController.getInfo);
router.get('/metrics', systemController.getMetrics);
router.get('/cpu', systemController.getCPU);
router.get('/memory', systemController.getMemory);
router.get('/gpu', systemController.getGPU);

export default router;
