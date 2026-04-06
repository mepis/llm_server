<template>
  <div class="monitor-container">
    <Header />
    <Sidebar />
    <main class="monitor-main">
      <div class="monitor-header">
        <h1>System Monitor</h1>
        <Button label="Refresh" icon="pi pi-refresh" @click="loadMetrics" />
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading metrics...</p>
      </div>

      <div v-else class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <i class="pi pi-server"></i>
            <h3>System Health</h3>
          </div>
          <div class="metric-value" :class="'status-' + health?.status">
            {{ health?.status || 'unknown' }}
          </div>
          <div class="metric-details">
            <p>Uptime: {{ formatUptime(health?.uptime) }}</p>
            <p>Database: {{ health?.database || 'unknown' }}</p>
            <p>Llama.cpp: {{ health?.llama_cpp || 'unknown' }}</p>
            <p>Active Workers: {{ health?.active_workers || 0 }}</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <i class="pi pi-chart-bar"></i>
            <h3>Performance</h3>
          </div>
          <div class="metric-value">
            {{ performance?.requests_per_second || '0' }}
          </div>
          <div class="metric-label">Requests/sec</div>
          <div class="metric-details">
            <p>Avg Response: {{ performance?.average_response_time_ms || '0' }}ms</p>
            <p>Error Rate: {{ performance?.error_rate || '0' }}</p>
            <p>Worker Queue: {{ performance?.worker_queue_length || 0 }}</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <i class="pi pi-microchip"></i>
            <h3>CPU Usage</h3>
          </div>
          <div class="metric-value">
            {{ performance?.cpu_usage || '0' }}%
          </div>
          <div class="metric-details">
            <p>Memory: {{ performance?.memory_usage_mb || '0' }} MB</p>
            <p>Active Workers: {{ performance?.active_workers || 0 }}</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <i class="pi pi-database"></i>
            <h3>Database</h3>
          </div>
          <div class="metric-value">
            {{ performance?.database_queries_per_second || '0' }}
          </div>
          <div class="metric-label">Queries/sec</div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <i class="pi pi-brain"></i>
            <h3>LLM Inference</h3>
          </div>
          <div class="metric-value">
            {{ performance?.llama_inferences_per_second || '0' }}
          </div>
          <div class="metric-label">Inferences/sec</div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Button from 'primevue/button'

const loading = ref(false)
const health = ref(null)
const performance = ref(null)

const formatUptime = (seconds) => {
  if (!seconds) return '0s'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m ${seconds % 60}s`
}

const loadMetrics = async () => {
  loading.value = true
  
  try {
    const [healthRes, perfRes] = await Promise.all([
      fetch('http://127.0.0.1:3000/api/monitor/health'),
      fetch('http://127.0.0.1:3000/api/monitor/performance')
    ])
    
    const healthData = await healthRes.json()
    const perfData = await perfRes.json()
    
    health.value = healthData.data
    performance.value = perfData.data
  } catch (error) {
    console.error('Failed to load metrics:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMetrics()
  setInterval(loadMetrics, 10000)
})
</script>

<style scoped>
.monitor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.monitor-main {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.monitor-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric-header i {
  font-size: 1.5rem;
  color: #2d6a4f;
}

.metric-header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.metric-value.status-healthy {
  color: #059669;
}

.metric-value.status-unhealthy {
  color: #dc2626;
}

.metric-label {
  font-size: 0.875rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.metric-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.metric-details p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}
</style>