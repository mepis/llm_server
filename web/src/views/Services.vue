<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '../services/api';

const services = ref([]);
const logs = ref({});
const loading = ref(true);
const actionLoading = ref({});
let statusInterval = null;

async function fetchServices() {
  try {
    const response = await api.getServiceStatus();
    services.value = response.data.data || [];
    loading.value = false;
  } catch (err) {
    console.error('Failed to fetch services:', err);
    loading.value = false;
  }
}

async function fetchLogs(serviceName) {
  try {
    const response = await api.getServiceLogs(serviceName);
    logs.value[serviceName] = response.data.data.logs || [];
  } catch (err) {
    console.error(`Failed to fetch logs for ${serviceName}:`, err);
  }
}

async function startService(serviceName) {
  try {
    actionLoading.value[serviceName] = true;
    await api.startService(serviceName);
    await fetchServices();
  } catch (err) {
    console.error(`Failed to start ${serviceName}:`, err);
  } finally {
    actionLoading.value[serviceName] = false;
  }
}

async function stopService(serviceName) {
  try {
    actionLoading.value[serviceName] = true;
    await api.stopService(serviceName);
    await fetchServices();
  } catch (err) {
    console.error(`Failed to stop ${serviceName}:`, err);
  } finally {
    actionLoading.value[serviceName] = false;
  }
}

async function restartService(serviceName) {
  try {
    actionLoading.value[serviceName] = true;
    await api.restartService(serviceName);
    await fetchServices();
  } catch (err) {
    console.error(`Failed to restart ${serviceName}:`, err);
  } finally {
    actionLoading.value[serviceName] = false;
  }
}

async function toggleAutoStart(serviceName, enable) {
  try {
    actionLoading.value[serviceName] = true;
    if (enable) {
      await api.enableService(serviceName);
    } else {
      await api.disableService(serviceName);
    }
    await fetchServices();
  } catch (err) {
    console.error(`Failed to toggle auto-start for ${serviceName}:`, err);
  } finally {
    actionLoading.value[serviceName] = false;
  }
}

onMounted(async () => {
  await fetchServices();
  // Update service status every 5 seconds
  statusInterval = setInterval(fetchServices, 5000);
});

onUnmounted(() => {
  if (statusInterval) {
    clearInterval(statusInterval);
  }
});

function getStatusBadge(status) {
  const badges = {
    'running': 'badge-success',
    'stopped': 'badge-error',
    'failed': 'badge-error',
    'inactive': 'badge-warning'
  };
  return badges[status] || 'badge-info';
}

function toggleLogs(serviceName) {
  if (logs.value[serviceName]) {
    delete logs.value[serviceName];
  } else {
    fetchLogs(serviceName);
  }
}
</script>

<template>
  <div class="services-page">
    <div class="page-header">
      <h1>Services Management</h1>
      <p class="subtitle">Manage systemd services and monitoring</p>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading services...</p>
    </div>

    <div v-else class="services-content">
      <div v-if="services.length === 0" class="empty-state">
        <p>No services available</p>
      </div>

      <div v-else class="services-grid">
        <div v-for="service in services" :key="service.name" class="card service-card">
          <div class="service-header">
            <div class="service-title">
              <h3>{{ service.name }}</h3>
              <span class="badge" :class="getStatusBadge(service.status)">
                {{ service.active ? 'Running' : 'Stopped' }}
              </span>
            </div>
            <div class="service-actions">
              <button
                v-if="!service.active"
                class="btn btn-sm btn-primary"
                @click="startService(service.name)"
                :disabled="actionLoading[service.name]"
              >
                Start
              </button>
              <button
                v-if="service.active"
                class="btn btn-sm btn-secondary"
                @click="stopService(service.name)"
                :disabled="actionLoading[service.name]"
              >
                Stop
              </button>
              <button
                class="btn btn-sm btn-secondary"
                @click="restartService(service.name)"
                :disabled="actionLoading[service.name]"
              >
                Restart
              </button>
            </div>
          </div>

          <div class="service-info">
            <div class="info-item">
              <span class="label">Status:</span>
              <span class="value">{{ service.status || 'unknown' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Auto-start:</span>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="service.enabled"
                  @change="toggleAutoStart(service.name, !service.enabled)"
                  :disabled="actionLoading[service.name]"
                />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div v-if="service.pid" class="info-item">
              <span class="label">PID:</span>
              <span class="value">{{ service.pid }}</span>
            </div>
            <div v-if="service.memory" class="info-item">
              <span class="label">Memory:</span>
              <span class="value">{{ service.memory }}</span>
            </div>
          </div>

          <div class="service-footer">
            <button
              class="btn btn-sm btn-secondary"
              @click="toggleLogs(service.name)"
            >
              {{ logs[service.name] ? 'Hide Logs' : 'Show Logs' }}
            </button>
          </div>

          <div v-if="logs[service.name]" class="logs-container">
            <div class="logs-header">
              <h4>Recent Logs</h4>
            </div>
            <div class="logs-content">
              <div v-if="logs[service.name].length === 0" class="empty-logs">
                No logs available
              </div>
              <div
                v-for="(log, index) in logs[service.name]"
                :key="index"
                class="log-line"
              >
                {{ log }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.services-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #6b7280;
  font-size: 1rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #2dd4bf;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: #6b7280;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.service-card {
  display: flex;
  flex-direction: column;
}

.service-header {
  margin-bottom: 1rem;
}

.service-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.service-title h3 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin: 0;
}

.service-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.service-info {
  background: #f8fffe;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
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

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #2dd4bf;
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.service-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.logs-container {
  margin-top: 1rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.logs-header h4 {
  font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 0.75rem;
}

.logs-content {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  max-height: 300px;
  overflow-y: auto;
}

.empty-logs {
  color: #6b7280;
  text-align: center;
  padding: 1rem;
}

.log-line {
  padding: 0.25rem 0;
  line-height: 1.5;
  word-wrap: break-word;
}
</style>
