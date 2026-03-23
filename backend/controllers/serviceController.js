const systemdService = require('../services/systemdService');

class ServiceController {
  async listServices(req, res) {
    try {
      const services = await systemdService.listServices();
      res.json({ services });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createService(req, res) {
    try {
      const { scriptName, serviceName, description, user } = req.body;
      if (!scriptName || !serviceName) {
        return res.status(400).json({ error: 'scriptName and serviceName are required' });
      }
      const createdService = await systemdService.createService(
        scriptName,
        serviceName,
        description || '',
        user || 'root'
      );
      res.json({ success: true, serviceName: createdService, message: 'Service created successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async removeService(req, res) {
    try {
      const { name } = req.params;
      await systemdService.removeService(name);
      res.json({ success: true, message: 'Service removed successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async startService(req, res) {
    try {
      const { name } = req.params;
      const result = await systemdService.startService(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async stopService(req, res) {
    try {
      const { name } = req.params;
      const result = await systemdService.stopService(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async restartService(req, res) {
    try {
      const { name } = req.params;
      const result = await systemdService.restartService(name);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getServiceStatus(req, res) {
    try {
      const { name } = req.params;
      const status = await systemdService.getServiceStatus(name);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ServiceController();
