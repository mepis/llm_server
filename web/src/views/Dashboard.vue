<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '../services/api';
import { formatBytes } from '../utils/formatting.js';
import { getUsageStatusClass } from '../utils/statusHelpers.js';
import { POLLING } from '../config/constants.js';

const systemInfo = ref(null);
const metrics = ref(null);
const loading = ref(true);
const error = ref(null);
let metricsInterval = null;

async function fetchSystemInfo() {
  try {
    const response = await api.getSystemInfo();
    systemInfo.value = response.data;
  } catch (err) {
    console.error('Failed to fetch system info:', err);
    error.value = 'Failed to load system information';
  }
}

async function fetchMetrics() {
  try {
    const response = await api.getSystemMetrics();
    metrics.value = response.data;
    loading.value = false;
  } catch (err) {
    console.error('Failed to fetch metrics:', err);
    error.value = 'Failed to load system metrics';
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchSystemInfo();
  await fetchMetrics();
  metricsInterval = setInterval(fetchMetrics, POLLING.METRICS);
});

onUnmounted(() => {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }
});

function getMemoryPercentage() {
  if (!metrics.value?.memory) return 0;
  return ((metrics.value.memory.used / metrics.value.memory.total) * 100).toFixed(1);
}

function getCPUStatusClass() {
  return getUsageStatusClass(metrics.value?.cpu?.usage ?? 0);
}

function getMemoryStatusClass() {
  return getUsageStatusClass(getMemoryPercentage());
}
</script>

<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>Dashboard</h1>
      <p class="subtitle">System monitoring and overview</p>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading system information...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
    </div>

    <div v-else class="dashboard-content">
      <!-- System Info Cards -->
      <div class="info-grid">
        <div class="card info-card">
          <h3>System Information</h3>
          <div class="info-item">
            <span class="label">Platform:</span>
            <span class="value">{{ systemInfo?.platform || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Architecture:</span>
            <span class="value">{{ systemInfo?.cpu?.architecture || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">CPU Model:</span>
            <span class="value">{{ systemInfo?.cpu?.model || 'N/A' }}</span>
          </div>
          <div class="info-item">
            <span class="label">CPU Cores:</span>
            <span class="value">{{ systemInfo?.cpu?.cores || 'N/A' }}</span>
          </div>
        </div>

        <div class="card info-card">
          <h3>Hardware Features</h3>
          <div class="features">
            <span v-if="systemInfo?.cpu?.features?.avx2" class="badge badge-success">AVX2</span>
            <span v-if="systemInfo?.cpu?.features?.avx512" class="badge badge-success">AVX512</span>
            <span v-if="systemInfo?.gpu?.nvidia?.available" class="badge badge-success">NVIDIA GPU</span>
            <span v-if="systemInfo?.gpu?.amd?.available" class="badge badge-success">AMD GPU</span>
            <span v-if="!systemInfo?.cpu?.features?.avx2 && !systemInfo?.gpu?.nvidia?.available && !systemInfo?.gpu?.amd?.available" class="badge badge-info">CPU Only</span>
          </div>
          <div v-if="systemInfo?.gpu?.nvidia?.available" class="gpu-info">
            <p class="gpu-name">{{ systemInfo.gpu.nvidia.name }}</p>
            <p class="gpu-memory">{{ formatBytes(systemInfo.gpu.nvidia.memory) }} VRAM</p>
          </div>
          <div v-else-if="systemInfo?.gpu?.amd?.available" class="gpu-info">
            <p class="gpu-name">{{ systemInfo.gpu.amd.name }}</p>
          </div>
        </div>

        <div class="card info-card">
          <h3>Recommended Build</h3>
          <div class="build-recommendation">
            <div class="build-type">
              <span class="build-icon">🔨</span>
              <span class="build-name">{{ systemInfo?.recommendedBuild || 'cpu' }}</span>
            </div>
            <p class="build-description">
              {{ systemInfo?.recommendedBuild === 'cuda' ? 'NVIDIA GPU acceleration available' :
                 systemInfo?.recommendedBuild === 'rocm' ? 'AMD GPU acceleration available' :
                 'CPU-only build recommended' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Metrics Cards -->
      <div class="metrics-grid">
        <div class="card metric-card">
          <h3>CPU Usage</h3>
          <div class="metric-value" :class="getCPUStatusClass()">
            {{ metrics?.cpu?.usage?.toFixed(1) || '0.0' }}%
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="getCPUStatusClass()"
              :style="{ width: (metrics?.cpu?.usage || 0) + '%' }"
            ></div>
          </div>
          <p class="metric-label">{{ metrics?.cpu?.cores || 0 }} cores available</p>
        </div>

        <div class="card metric-card">
          <h3>Memory Usage</h3>
          <div class="metric-value" :class="getMemoryStatusClass()">
            {{ getMemoryPercentage() }}%
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="getMemoryStatusClass()"
              :style="{ width: getMemoryPercentage() + '%' }"
            ></div>
          </div>
          <p class="metric-label">
            {{ formatBytes(metrics?.memory?.used) }} / {{ formatBytes(metrics?.memory?.total) }}
          </p>
        </div>

        <div class="card metric-card">
          <h3>System Uptime</h3>
          <div class="metric-value normal">
            {{ Math.floor((metrics?.uptime || 0) / 3600) }}h
          </div>
          <p class="metric-label">
            {{ Math.floor(((metrics?.uptime || 0) % 3600) / 60) }} minutes
          </p>
        </div>

        <div class="card metric-card">
          <h3>Load Average</h3>
          <div class="metric-value normal">
            {{ metrics?.loadAverage?.[0]?.toFixed(2) || '0.00' }}
          </div>
          <p class="metric-label">
            1min: {{ metrics?.loadAverage?.[0]?.toFixed(2) || '0.00' }} |
            5min: {{ metrics?.loadAverage?.[1]?.toFixed(2) || '0.00' }} |
            15min: {{ metrics?.loadAverage?.[2]?.toFixed(2) || '0.00' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-card h3 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #6b7280;
  font-weight: 500;
}

.info-item .value {
  color: #2c3e50;
  font-weight: 600;
}

.features {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.gpu-info {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.gpu-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.gpu-memory {
  color: #6b7280;
  font-size: 0.875rem;
}

.build-recommendation {
  text-align: center;
  padding: 1rem 0;
}

.build-type {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.build-icon {
  font-size: 2rem;
}

.build-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2dd4bf;
  text-transform: uppercase;
}

.build-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.metric-card h3 {
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.metric-value.normal {
  color: #2dd4bf;
}

.metric-value.medium {
  color: #f59e0b;
}

.metric-value.high {
  color: #ef4444;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 4px;
}

.progress-fill.normal {
  background: linear-gradient(90deg, #5dd4bf 0%, #2dd4bf 100%);
}

.progress-fill.medium {
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
}

.progress-fill.high {
  background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
}

.metric-label {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
