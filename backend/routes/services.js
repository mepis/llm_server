const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/', (req, res) => serviceController.listServices(req, res));
router.post('/', (req, res) => serviceController.createService(req, res));
router.delete('/:name', (req, res) => serviceController.removeService(req, res));
router.post('/:name/start', (req, res) => serviceController.startService(req, res));
router.post('/:name/stop', (req, res) => serviceController.stopService(req, res));
router.post('/:name/restart', (req, res) => serviceController.restartService(req, res));
router.get('/:name/status', (req, res) => serviceController.getServiceStatus(req, res));

module.exports = router;
