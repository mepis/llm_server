const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

class ScriptService {
  constructor() {
    this.scriptsDir = process.env.SCRIPTS_DIR || process.env.HOME + '/.llm_server/scripts';
  }

  async listScripts() {
    try {
      const files = await fs.readdir(this.scriptsDir);
      const scripts = await Promise.all(
        files
          .filter(f => f.endsWith('.sh'))
          .map(async (file) => {
            const filePath = path.join(this.scriptsDir, file);
            const stat = await fs.stat(filePath);
            return {
              name: file,
              path: filePath,
              created: stat.birthtime,
              modified: stat.mtime
            };
          })
      );
      return scripts;
    } catch (error) {
      throw new Error(`Failed to list scripts: ${error.message}`);
    }
  }

  async createScript(name, content, permissions = '755') {
    try {
      const filePath = path.join(this.scriptsDir, name);
      await fs.writeFile(filePath, content);
      await fs.chmod(filePath, parseInt(permissions, 8));
      return filePath;
    } catch (error) {
      throw new Error(`Failed to create script: ${error.message}`);
    }
  }

  async getScript(name) {
    try {
      const filePath = path.join(this.scriptsDir, name);
      const content = await fs.readFile(filePath, 'utf-8');
      const stat = await fs.stat(filePath);
      return {
        name,
        content,
        path: filePath,
        created: stat.birthtime,
        modified: stat.mtime
      };
    } catch (error) {
      throw new Error(`Script not found: ${name}`);
    }
  }

  async updateScript(name, content) {
    try {
      const filePath = path.join(this.scriptsDir, name);
      await fs.writeFile(filePath, content);
      return true;
    } catch (error) {
      throw new Error(`Failed to update script: ${error.message}`);
    }
  }

  async deleteScript(name) {
    try {
      const filePath = path.join(this.scriptsDir, name);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete script: ${error.message}`);
    }
  }

  async runScript(name, background = false) {
    try {
      const filePath = path.join(this.scriptsDir, name);
      
      return new Promise((resolve, reject) => {
        const options = background ? { detached: true } : {};
        const child = exec(`"${filePath}"`, options, (error, stdout, stderr) => {
          if (error) {
            reject({
              error: error.message,
              stdout: stdout || '',
              stderr: stderr || '',
              exitCode: error.code || 1
            });
            return;
          }
          resolve({
            success: true,
            output: stdout || stderr,
            exitCode: 0
          });
        });

        if (background) {
          child.unref();
          resolve({
            success: true,
            jobId: child.pid,
            message: `Script running in background (PID: ${child.pid})`
          });
        }
      });
    } catch (error) {
      throw new Error(`Failed to run script: ${error.message}`);
    }
  }
}

module.exports = new ScriptService();
