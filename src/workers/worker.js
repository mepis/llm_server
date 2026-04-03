const { parentPort, workerData } = require('worker_threads');
const argon2 = require('argon2');

const { type, data } = workerData;

if (type === 'hashPassword') {
  try {
    const hash = await argon2.hash(data.password);
    parentPort.postMessage({ success: true, hash });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
} else if (type === 'verifyPassword') {
  try {
    const isValid = await argon2.verify(data.hash, data.password);
    parentPort.postMessage({ success: true, isValid });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
}
