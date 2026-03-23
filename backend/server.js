const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const scriptRoutes = require('./routes/scripts');
const serviceRoutes = require('./routes/services');
const modelRoutes = require('./routes/models');
const { loadConfig } = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/scripts', scriptRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/models', modelRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

loadConfig().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`LLM Server API running on http://${HOST}:${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to load config:', error);
  process.exit(1);
});

module.exports = app;
