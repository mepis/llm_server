const argon2 = require('node-argon2');
const { spawn } = require('child_process');
const { truncateOutput } = require('../tool/truncate');

module.exports = async (request) => {
  const { type } = request;

  if (type === 'hashPassword') {
    try {
      const hash = await argon2.hash(request.data.password);
      return { success: true, hash };
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else if (type === 'verifyPassword') {
    try {
      const isValid = await argon2.verify(request.data.hash, request.data.password);
      return { success: true, isValid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else if (type === 'bash') {
    return executeBash(request);
  }
};

function executeBash(request) {
  return new Promise((resolve) => {
    const { command, workdir, timeout } = request;
    const session_id = request.session_id;

    const process = spawn(command, {
      shell: true,
      cwd: workdir || process.cwd(),
      timeout: timeout || 30000,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        process.kill('SIGTERM');
      } catch (e) {}
    }, timeout || 30000);

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        output: `Process error: ${error.message}`,
        exitCode: -1,
        timedOut: false,
      });
    });

    process.on('exit', (code) => {
      clearTimeout(timer);
      const output = stdout + (stderr ? `\n${stderr}` : '');
      resolve({
        output: truncateOutput(output),
        exitCode: code,
        timedOut,
      });
    });
  });
}
