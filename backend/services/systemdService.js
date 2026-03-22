const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class SystemdService {
  constructor() {
    this.servicesDir = process.env.SERVICES_DIR || './integrations/linux/services';
  }

  async createService(scriptName, serviceName, description = '', user = 'root') {
    const scriptPath = path.join(process.env.SCRIPTS_DIR || './scripts', scriptName);
    
    const serviceContent = `[Unit]
Description=${description || 'LLM Server Service'}
After=network.target

[Service]
Type=simple
WorkingDirectory=%h
ExecStart=${scriptPath}
Restart=on-failure
RestartSec=5
User=${user}

[Install]
WantedBy=default.target
`;

    const serviceFile = path.join(this.servicesDir, `${serviceName}.service`);
    await fs.writeFile(serviceFile, serviceContent);

    await this._execSystemctl('daemon-reload');
    await this._execSystemctl(`enable ${serviceName}`);
    await this._execSystemctl(`start ${serviceName}`);

    return serviceName;
  }

  async removeService(serviceName) {
    try {
      await this._execSystemctl(`stop ${serviceName}`);
    } catch (e) {
      // Service might not be running
    }
    
    try {
      await this._execSystemctl(`disable ${serviceName}`);
    } catch (e) {
      // Service might not be enabled
    }
    
    const serviceFile = path.join(this.servicesDir, `${serviceName}.service`);
    try {
      await fs.unlink(serviceFile);
    } catch (e) {
      // Service file might not exist
    }

    await this._execSystemctl('daemon-reload');
  }

  async getServiceStatus(serviceName) {
    try {
      const result = await this._execSystemctl(`status ${serviceName} --no-pager`);
      const isActive = result.includes('active (running)');
      return {
        name: serviceName,
        status: isActive ? 'running' : 'stopped'
      };
    } catch (error) {
      return {
        name: serviceName,
        status: 'error',
        error: error.message
      };
    }
  }

  async listServices() {
    try {
      const result = await this._execSystemctl('list-units --type=service --no-pager');
      const services = [];
      const lines = result.split('\n');
      
      lines.forEach(line => {
        if (line.includes('llama') || line.includes('llm')) {
          const parts = line.split(/\s+/);
          services.push({
            name: parts[2]?.replace('.service', ''),
            status: parts[3],
            loaded: parts[4]
          });
        }
      });
      
      return services;
    } catch (error) {
      throw new Error(`Failed to list services: ${error.message}`);
    }
  }

  async startService(serviceName) {
    try {
      await this._execSystemctl(`start ${serviceName}`);
      return { success: true, message: `Service ${serviceName} started` };
    } catch (error) {
      throw new Error(`Failed to start service: ${error.message}`);
    }
  }

  async stopService(serviceName) {
    try {
      await this._execSystemctl(`stop ${serviceName}`);
      return { success: true, message: `Service ${serviceName} stopped` };
    } catch (error) {
      throw new Error(`Failed to stop service: ${error.message}`);
    }
  }

  async restartService(serviceName) {
    try {
      await this._execSystemctl(`restart ${serviceName}`);
      return { success: true, message: `Service ${serviceName} restarted` };
    } catch (error) {
      throw new Error(`Failed to restart service: ${error.message}`);
    }
  }

  async _execSystemctl(command) {
    return new Promise((resolve, reject) => {
      exec(`sudo ${command}`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        resolve(stdout);
      });
    });
  }
}

module.exports = new SystemdService();
