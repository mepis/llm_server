const { exec } = require('child_process');
const https = require('https');
const path = require('path');
const fs = require('fs').promises;

class HuggingFaceService {
  constructor() {
    this.downloadDir = process.env.MODEL_DIR || '~/.llm_server/models';
    this.downloads = new Map();
  }

  async searchModels(query, limit = 20, sort = 'downloads', order = 'desc') {
    const url = new URL('https://huggingface.co/api/models');
    url.searchParams.set('search', query);
    url.searchParams.set('limit', Math.min(limit, 100).toString());
    url.searchParams.set('sort', sort);
    url.searchParams.set('direction', order);

    return new Promise((resolve, reject) => {
      https.get(url.toString(), (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const models = JSON.parse(data);
            resolve(models.map(m => ({
              id: m.modelId,
              name: m.name || m.modelId.split('/')[1],
              author: m.author,
              downloads: m.downloads || 0,
              likes: m.likes || 0,
              tags: m.tags || [],
              description: m.description || ''
            })));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async getModelDetails(modelId) {
    const url = `https://huggingface.co/api/models/${modelId}`;
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const model = JSON.parse(data);
            resolve({
              id: model.modelId,
              name: model.name || model.modelId.split('/')[1],
              author: model.author,
              downloads: model.downloads || 0,
              likes: model.likes || 0,
              tags: model.tags || [],
              description: model.description || '',
              files: model.private ? [] : model.siblings?.map(f => f.rfilename) || [],
              created: model.created_at,
              modified: model.lastModified
            });
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async downloadModel(modelId, fileName = null, destination = null, token = null) {
    const dest = destination || this.downloadDir;
    await fs.mkdir(dest, { recursive: true });

    let command = `hf download ${modelId}`;
    if (fileName) {
      command += ` ${fileName}`;
    }
    if (dest) {
      command += ` --local-dir ${dest}`;
    }
    if (token) {
      command += ` --token ${token}`;
    }

    const jobId = Date.now().toString();
    this.downloads.set(jobId, {
      jobId,
      modelId,
      fileName,
      status: 'running',
      progress: 0,
      downloaded: 0,
      total: 0,
      speed: 0,
      eta: null,
      created: new Date()
    });

    return new Promise((resolve, reject) => {
      const child = exec(command, { maxBuffer: 1024 * 1024 * 100 });
      
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
        const progressMatch = data.toString().match(/(\d+)%/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1]);
          const download = this.downloads.get(jobId);
          if (download) {
            download.progress = progress;
          }
        }
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
        const progressMatch = data.toString().match(/(\d+)%/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1]);
          const download = this.downloads.get(jobId);
          if (download) {
            download.progress = progress;
          }
        }
      });

      child.on('close', (code) => {
        const download = this.downloads.get(jobId);
        if (download) {
          download.status = code === 0 ? 'completed' : 'failed';
          download.progress = code === 0 ? 100 : download.progress;
        }

        if (code === 0) {
          resolve({
            success: true,
            jobId,
            path: dest,
            message: 'Download completed successfully'
          });
        } else {
          reject({ error: `Download failed with code ${code}`, output });
        }
      });

      child.on('error', (err) => {
        const download = this.downloads.get(jobId);
        if (download) {
          download.status = 'failed';
        }
        reject({ error: err.message });
      });
    });
  }

  async getDownloadStatus(jobId) {
    const download = this.downloads.get(jobId);
    if (!download) {
      throw new Error(`Download not found: ${jobId}`);
    }
    return download;
  }

  async listDownloads() {
    return Array.from(this.downloads.values());
  }
}

module.exports = new HuggingFaceService();
