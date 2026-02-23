/**
 * Service Routes
 * API routes for service management
 */

import express from 'express';
import * as serviceController from '../controllers/serviceController.js';

const router = express.Router();

// Service management routes
router.get('/status', serviceController.getAllStatus);
router.get('/:serviceName/status', serviceController.getStatus);
router.post('/:serviceName/start', serviceController.start);
router.post('/:serviceName/stop', serviceController.stop);
router.post('/:serviceName/restart', serviceController.restart);
router.post('/:serviceName/enable', serviceController.enable);
router.post('/:serviceName/disable', serviceController.disable);
router.get('/:serviceName/logs', serviceController.logs);

export default router;
