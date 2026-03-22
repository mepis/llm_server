const { exec } = require('child_process');

class JournalService {
  async getLogs(serviceName, lines = 100) {
    return new Promise((resolve, reject) => {
      const cmd = `sudo journalctl -u ${serviceName} -n ${lines} --no-pager`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject({ error: error.message, stderr });
          return;
        }
        const logs = stdout.trim().split('\n').filter(line => line.length > 0);
        resolve({ logs, service: serviceName });
      });
    });
  }

  async getLogsStream(serviceName) {
    const child = exec(`sudo journalctl -u ${serviceName} -f --no-pager`);
    const logs = [];
    
    return {
      stream: child.stdout,
      logs: () => logs,
      close: () => child.kill()
    };
  }
}

module.exports = new JournalService();
