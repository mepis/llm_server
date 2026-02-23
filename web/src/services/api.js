/**
 * API Service
 * Handles all backend API calls
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default {
  // Health
  getHealth() {
    return api.get('/health');
  },

  // System
  getSystemInfo() {
    return api.get('/system/info');
  },
  getSystemMetrics() {
    return api.get('/system/metrics');
  },
  getCPU() {
    return api.get('/system/cpu');
  },
  getMemory() {
    return api.get('/system/memory');
  },
  getGPU() {
    return api.get('/system/gpu');
  },

  // Llama
  cloneLlama() {
    return api.post('/llama/clone');
  },
  buildLlama(buildType = 'auto') {
    return api.post('/llama/build', { buildType });
  },
  getBuildStatus(buildId) {
    return api.get(`/llama/build/${buildId}`);
  },
  getBuildOutput(buildId, fromIndex = 0) {
    return api.get(`/llama/build/${buildId}/output`, { params: { fromIndex } });
  },
  getActiveBuilds() {
    return api.get('/llama/builds/active');
  },
  getBuildHistory(limit = 50) {
    return api.get('/llama/builds/history', { params: { limit } });
  },
  killBuild(buildId) {
    return api.delete(`/llama/build/${buildId}`);
  },

  // Services
  getAllServiceStatus() {
    return api.get('/service/status');
  },
  getServiceStatus(serviceName) {
    return api.get(`/service/${serviceName}/status`);
  },
  startService(serviceName) {
    return api.post(`/service/${serviceName}/start`);
  },
  stopService(serviceName) {
    return api.post(`/service/${serviceName}/stop`);
  },
  restartService(serviceName) {
    return api.post(`/service/${serviceName}/restart`);
  },
  enableService(serviceName) {
    return api.post(`/service/${serviceName}/enable`);
  },
  disableService(serviceName) {
    return api.post(`/service/${serviceName}/disable`);
  },
  getServiceLogs(serviceName, lines = 100) {
    return api.get(`/service/${serviceName}/logs`, { params: { lines } });
  }
};
