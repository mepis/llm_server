const llamaService = require('../services/llamaService');

const getModels = async (req, res) => {
  try {
    const models = await llamaService.getModels();
    res.json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createChatCompletion = async (req, res) => {
  try {
    const { messages, model, stream } = req.body;
    if (stream) {
      // For simplicity, we'll handle streaming by just returning the service generator
      // but usually a controller needs to manage the response stream.
      // This is a placeholder implementation.
      const generator = llamaService.getChatCompletions(messages, { model, stream: true });
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of generator) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.end();
    } else {
      const response = await llamaService.getChatCompletions(messages, { model, stream: false });
      res.json({ success: true, data: response });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createEmbedding = async (req, res) => {
  try {
    const { input, model } = req.body;
    const embedding = await llamaService.getEmbeddings(input, { model });
    res.json({ success: true, data: embedding });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getHealth = async (req, res) => {
  try {
    // Assuming llamaService has a method to check llama health or similar
    // For now, we'll just return ok.
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
};

module.exports = {
  getModels,
  createChatCompletion,
  createEmbedding,
  getHealth
};
