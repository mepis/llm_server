const { Worker } = require('worker_threads');
const path = require('path');
const Piscina = require('piscina');

const workerPath = path.join(__dirname, '../workers/worker.js');

const piscina = new Piscina({
  filename: workerPath,
  minThreads: 2,
  maxThreads: 4,
  idleTimeout: 30000,
  maxTasksPerWorker: 1000
});

module.exports = piscina;
