require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/database');
const db = require('./config/db');
const logger = require('./utils/logger');
const rateLimiter = require('./config/rateLimiter');
const { validateEnvironment } = require('./utils/environment');
const { initTTSClient, shutdownTTS } = require('./services/llamaService');
const roleService = require('./services/roleService');
const { setupDatabase } = require('./utils/database');
const { initQdrant } = require('./db/qdrant');

validateEnvironment();

const app = express();
app.set('port', config.port);

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(rateLimiter.apiLimiter);

app.use('/api', require('./routes/api'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Global error handler - catches multer and other middleware errors
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'File size exceeds the 10 MB limit'
    });
  }

  if (err.message === 'Invalid file type') {
    const allowed = ['txt', 'md', 'pdf', 'json', 'csv', 'docx', 'xlsx'];
    return res.status(415).json({
      success: false,
      error: `Invalid file type. Supported formats: ${allowed.join(', ')}`
    });
  }

  if (err.message === 'Unexpected field') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const startServer = async () => {
  try {
    await db.connectDB();
    await setupDatabase();

    try {
      await initQdrant();
    } catch (error) {
      logger.warn('Qdrant initialization failed (RAG features will be unavailable):', error.message);
    }

    await roleService.ensureBuiltinRoles();

    initTTSClient();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  shutdownTTS();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  shutdownTTS();
  process.exit(0);
});
