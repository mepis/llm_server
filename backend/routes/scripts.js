const express = require('express');
const router = express.Router();
const scriptController = require('../controllers/scriptController');

router.get('/', (req, res) => scriptController.listScripts(req, res));
router.post('/', (req, res) => scriptController.createScript(req, res));
router.get('/:name', (req, res) => scriptController.getScript(req, res));
router.put('/:name', (req, res) => scriptController.updateScript(req, res));
router.delete('/:name', (req, res) => scriptController.deleteScript(req, res));
router.post('/:name/run', (req, res) => scriptController.runScript(req, res));

module.exports = router;
