const { exec, spawn } = require('child_process');
const fs = require('fs').promises;

class ShellExecutor {
  constructor() {
    this.timeout = 300000;
  }

  async execute(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = exec(command, {
        maxBuffer: 1024 * 1024 * 100,
        timeout: options.timeout || this.timeout,
        env: { ...process.env, ...options.env }
      }, (error, stdout, stderr) => {
        if (error) {
          reject({
            error: error.message,
            stdout: stdout || '',
            stderr: stderr || '',
            exitCode: error.code
          });
          return;
        }
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: 0
        });
      });

      if (options.timeout) {
        setTimeout(() => {
          child.kill('SIGTERM');
        }, options.timeout);
      }
    });
  }

  async executeDetached(command) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        shell: true,
        detached: true,
        stdio: 'ignore'
      });
      
      child.unref();
      resolve({
        success: true,
        pid: child.pid
      });
    });
  }

  async executeWithProgress(command, onProgress) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, {
        shell: true,
        env: { ...process.env }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const str = data.toString();
        stdout += str;
        if (onProgress) {
          onProgress({ output: str, stdout });
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            stdout,
            stderr,
            exitCode: 0
          });
        } else {
          reject({
            error: `Process exited with code ${code}`,
            stdout,
            stderr,
            exitCode: code
          });
        }
      });

      child.on('error', reject);
    });
  }
}

module.exports = new ShellExecutor();
