const fs = require('fs').promises;
const path = require('path');

const configPath = path.join(process.env.HOME || '/home/jon', '.llm_server', 'config.json');

let config = null;

/**
 * loadConfig description.
 * @param {...} args - Description of parameters.
 * @returns {any} Description of return value.
 */

/**
 * loadConfig description.
 * @param {...} args - Description of parameters.
 * @returns {any} Description of return value.
 */

async function loadConfig() {
  if (config) return config;

  try {
    const data = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(data);
  } catch (error) {
    config = {
      llmServerHome: path.join(process.env.HOME || '/home/jon', '.llm_server'),
      scriptsDir: path.join(process.env.HOME || '/home/jon', '.llm_server', 'scripts'),
      servicesDir: path.join(process.env.HOME || '/home/jon', '.llm_server', 'integrations', 'linux', 'services'),
      modelDir: path.join(process.env.HOME || '/home/jon', '.llm_server', 'models'),
      logsDir: path.join(process.env.HOME || '/home/jon', '.llm_server', 'logs'),
      huggingface: {
        token: null,
        cacheDir: path.join(process.env.HOME || '/home/jon', '.cache', 'huggingface')
      },
      server: {
        port: 3000,
        host: '127.0.0.1'
      }
    };
    await saveConfig(config);
  }

  return config;
}

/**
 * saveConfig description.
 * @param {...} args - Description of parameters.
 * @returns {any} Description of return value.
 */

/**
 * saveConfig description.
 * @param {...} args - Description of parameters.
 * @returns {any} Description of return value.
 */

async function saveConfig(newConfig) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
  config = newConfig;
}

module.exports = {
  loadConfig,
  saveConfig
};


