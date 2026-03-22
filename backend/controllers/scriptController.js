const scriptService = require('../services/scriptService');

class ScriptController {
  async listScripts(req, res) {
    try {
      const scripts = await scriptService.listScripts();
      res.json({ scripts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getScript(req, res) {
    try {
      const { name } = req.params;
      const script = await scriptService.getScript(name);
      res.json(script);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async createScript(req, res) {
    try {
      const { name, content, description, permissions } = req.body;
      if (!name || !content) {
        return res.status(400).json({ error: 'Name and content are required' });
      }
      const path = await scriptService.createScript(name, content, permissions);
      res.json({ success: true, path, message: 'Script created successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateScript(req, res) {
    try {
      const { name } = req.params;
      const { content, description } = req.body;
      await scriptService.updateScript(name, content);
      res.json({ success: true, message: 'Script updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteScript(req, res) {
    try {
      const { name } = req.params;
      await scriptService.deleteScript(name);
      res.json({ success: true, message: 'Script deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async runScript(req, res) {
    try {
      const { name } = req.params;
      const { background } = req.query;
      const result = await scriptService.runScript(name, background === 'true');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ScriptController();
