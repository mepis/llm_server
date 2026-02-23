/**
 * Service Routes
 * API routes for service management
 */

import express from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { validateService } from '../middleware/validateService.js';

const router = express.Router();

// Service management routes
router.get('/status', serviceController.getAllStatus);
router.get('/:serviceName/status', validateService, serviceController.getStatus);
router.post('/:serviceName/start', validateService, serviceController.start);
router.post('/:serviceName/stop', validateService, serviceController.stop);
router.post('/:serviceName/restart', validateService, serviceController.restart);
router.post('/:serviceName/enable', validateService, serviceController.enable);
router.post('/:serviceName/disable', validateService, serviceController.disable);
router.get('/:serviceName/logs', validateService, serviceController.logs);

export default router;
