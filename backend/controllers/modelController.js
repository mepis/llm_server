const huggingFaceService = require('../services/huggingFaceService');

class ModelController {
  async searchModels(req, res) {
    try {
      const { query, limit, sort, order } = req.query;
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }
      const models = await huggingFaceService.searchModels(
        query,
        parseInt(limit) || 20,
        sort || 'downloads',
        order || 'desc'
      );
      res.json({ models, total: models.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getModelDetails(req, res) {
    try {
      const { id } = req.params;
      const model = await huggingFaceService.getModelDetails(id);
      res.json(model);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async downloadModel(req, res) {
    try {
      const { modelId, fileName, destination, token } = req.body;
      if (!modelId) {
        return res.status(400).json({ error: 'modelId is required' });
      }
      const result = await huggingFaceService.downloadModel(
        modelId,
        fileName,
        destination,
        token
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDownloadStatus(req, res) {
    try {
      const { jobId } = req.params;
      const status = await huggingFaceService.getDownloadStatus(jobId);
      res.json(status);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async listDownloads(req, res) {
    try {
      const downloads = await huggingFaceService.listDownloads();
      res.json({ downloads });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ModelController();
