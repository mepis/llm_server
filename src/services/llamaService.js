const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config/database');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { spawn } = require('child_process');

let cachedModels = null;
let modelsCacheTime = null;
const CACHE_TTL = 60000;

// Chatterbox gRPC client
let chatterboxClient = null;
let chatterboxChildProcess = null;
const CHATTERBOX_PROTO_PATH = path.join(__dirname, '../services/chatterbox/tts.proto');

function loadChatterboxProto() {
  const packageDefinition = protoLoader.loadSync(CHATTERBOX_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  return protoDescriptor.tts;
}

function initChatterboxClient() {
  try {
    const ttsProto = loadChatterboxProto();
    const host = config.chatterbox.grpcHost;
    const port = config.chatterbox.grpcPort;

    chatterboxClient = new ttsProto.TTSService(
      `${host}:${port}`,
      grpc.credentials.createInsecure()
    );

    logger.info(`Chatterbox gRPC client initialized: ${host}:${port}`);
    return true;
  } catch (error) {
    logger.error(`Failed to initialize Chatterbox gRPC client: ${error.message}`);
    return false;
  }
}

function spawnChatterboxService() {
  try {
    const serviceScript = path.join(__dirname, '../services/chatterbox/tts_service.py');
    const port = config.chatterbox.grpcPort;

    chatterboxChildProcess = spawn('python3', [serviceScript, `--port=${port}`], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CHATTERBOX_SPEAKER_FILE: config.chatterbox.speakerFile || '',
      },
    });

    chatterboxChildProcess.stdout.on('data', (data) => {
      logger.info(`[chatterbox] ${data.toString().trim()}`);
    });

    chatterboxChildProcess.stderr.on('data', (data) => {
      logger.error(`[chatterbox] ${data.toString().trim()}`);
    });

    chatterboxChildProcess.on('error', (error) => {
      logger.error(`Failed to start Chatterbox service: ${error.message}`);
    });

    chatterboxChildProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        logger.error(`Chatterbox service exited with code ${code} (signal: ${signal})`);
      }
      chatterboxClient = null;
    });

    logger.info('Chatterbox TTS service process spawned');
    return true;
  } catch (error) {
    logger.error(`Failed to spawn Chatterbox service: ${error.message}`);
    return false;
  }
}

async function waitForChatterboxHealth(maxRetries = 30, retryDelayMs = 1000) {
  return new Promise((resolve) => {
    let retries = 0;

    const check = () => {
      if (!chatterboxClient) {
        resolve(false);
        return;
      }

      chatterboxClient.healthCheck({}, (err, response) => {
        if (err) {
          retries++;
          if (retries >= maxRetries) {
            logger.error(`Chatterbox service health check failed after ${maxRetries} attempts`);
            resolve(false);
          } else {
            logger.info(`Waiting for Chatterbox service... attempt ${retries}/${maxRetries}`);
            setTimeout(check, retryDelayMs);
          }
        } else if (response && (response.status === 1 || response.status === 'SERVING')) { // SERVING
          logger.info('Chatterbox service is healthy and ready');
          resolve(true);
        } else {
          retries++;
          if (retries >= maxRetries) {
            resolve(false);
          } else {
            setTimeout(check, retryDelayMs);
          }
        }
      });
    };

    check();
  });
}

function shutdownChatterboxService() {
  if (chatterboxChildProcess) {
    logger.info('Shutting down Chatterbox service...');
    chatterboxChildProcess.kill('SIGTERM');
    chatterboxChildProcess = null;
  }
  chatterboxClient = null;
}

const getModels = async () => {
  const now = Date.now();

  if (cachedModels && modelsCacheTime && (now - modelsCacheTime < CACHE_TTL)) {
    return cachedModels;
  }

  try {
    const response = await axios.get(`${config.llama.url}/v1/models`, {
      timeout: config.llama.timeout,
    });

    cachedModels = response.data;
    modelsCacheTime = now;

    return cachedModels;
  } catch (error) {
    logger.error('Failed to get models from Llama.cpp:', error.message);
    throw error;
  }
};

const getChatCompletions = async (messages, options = {}) => {
  try {
    const response = await axios.post(
      `${config.llama.url}/v1/chat/completions`,
      {
        messages,
        ...options,
      },
      {
        timeout: config.llama.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Failed to get chat completions:', error.message);
    throw error;
  }
};

const chatWithTools = async (messages, tools, options = {}) => {
  try {
    const response = await axios.post(
      `${config.llama.url}/v1/chat/completions`,
      {
        messages,
        tools,
        ...options,
      },
      {
        timeout: config.llama.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Failed to get chat completions with tools:', error.message);
    throw error;
  }
};

const getEmbeddings = async (input, model = 'all-MiniLM-L6-v2') => {
  try {
    const response = await axios.post(
      `${config.llama.url}/v1/embeddings`,
      {
        model,
        input: Array.isArray(input) ? input : [input],
      },
      {
        timeout: config.llama.timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Failed to get embeddings:', error.message);
    throw error;
  }
};

const healthCheck = async () => {
  try {
    const response = await axios.get(`${config.llama.url}/health`, {
      timeout: 5000,
    });
    return response.data;
  } catch (error) {
    logger.error('Llama.cpp health check failed:', error.message);
    return null;
  }
};

const generateAudio = async (text, options = {}) => {
  if (!chatterboxClient) {
    throw new Error('Chatterbox service not initialized. Ensure the gRPC service is running.');
  }

  const textToUse = typeof text === 'string' ? text.trim() : String(text);

  if (textToUse.length === 0) {
    throw new Error('Text cannot be empty');
  }

  const finalText = textToUse.length > 2000
    ? (() => { logger.warn(`Truncating text from ${textToUse.length} to 2000 characters`); return textToUse.substring(0, 2000); })()
    : textToUse;

  const request = {
    text: finalText,
    temperature: options.temperature || config.chatterbox.temperature,
    top_p: options.topP || config.chatterbox.topP,
    top_k: options.topK || config.chatterbox.topK,
  };

  if (options.speakerAudio && typeof options.speakerAudio === 'string') {
    request.speaker_audio = Buffer.from(options.speakerAudio, 'base64');
  }

  return new Promise((resolve, reject) => {
    chatterboxClient.generateSpeech(request, (err, response) => {
      if (err) {
        logger.error(`Chatterbox gRPC error: ${err.details || err.message}`);
        reject(new Error(`TTS generation failed: ${err.details || err.message}`));
        return;
      }

      if (!response || !response.audio_base64) {
        reject(new Error('TTS generation returned no audio data'));
        return;
      }

      const durationMs = response.duration_ms || 0;
      logger.info(`TTS generated ${durationMs}ms of audio (${finalText.length} chars)`);
      resolve(response.audio_base64);
    });
  });
};

module.exports = {
  getModels,
  getChatCompletions,
  chatWithTools,
  getEmbeddings,
  healthCheck,
  generateAudio,
  initChatterboxClient,
  spawnChatterboxService,
  waitForChatterboxHealth,
  shutdownChatterboxService,
};
