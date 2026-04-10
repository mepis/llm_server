<template>
  <div class="logs-container">
    <Header />
    <Sidebar />
    <main class="logs-main">
      <div class="logs-header">
        <h1>System Logs</h1>
        <div class="filter-actions">
          <Select v-model="levelFilter" :options="levelOptions" option-label="label" option-value="value" placeholder="All Levels" class="filter-select" />
          <Button label="Refresh" icon="pi pi-refresh" @click="loadLogs" />
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading logs...</p>
      </div>

      <div v-else-if="logs.length === 0" class="empty-state">
        <p>No logs available</p>
      </div>

      <div v-else class="logs-table-container">
        <table class="logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Service</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log._id" :class="'log-row log-level-' + log.log_level">
              <td class="log-time">{{ formatTime(log.timestamp) }}</td>
              <td><span class="log-badge" :class="'level-' + log.log_level">{{ log.log_level }}</span></td>
              <td class="log-service">{{ log.service }}</td>
              <td class="log-message">{{ log.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Button from 'primevue/button'
import Select from 'primevue/select'

const loading = ref(false)
const logs = ref([])
const levelFilter = ref(null)

const levelOptions = [
  { label: 'All Levels', value: null },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warn' },
  { label: 'Error', value: 'error' }
]

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = {}
    if (levelFilter.value) {
      params.level = levelFilter.value
    }
    
    const response = await fetch(`http://127.0.0.1:3000/api/logs${Object.keys(params).length ? '?' + new URLSearchParams(params) : ''}`)
    const data = await response.json()
    logs.value = data.data || []
  } catch (error) {
    console.error('Failed to load logs:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.logs-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.logs-main {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.logs-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.filter-actions {
  display: flex;
  gap: 1rem;
}

.filter-select {
  width: 150px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.logs-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th {
  text-align: left;
  padding: 1rem;
  background: #f9fafb;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

.logs-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.logs-table tbody tr:hover {
  background: #f9fafb;
}

.log-time {
  color: #6b7280;
  font-size: 0.875rem;
}

.log-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.level-info {
  background: #dbeafe;
  color: #1e40af;
}

.level-warn {
  background: #fef3c7;
  color: #92400e;
}

.level-error {
  background: #fee2e2;
  color: #991b1b;
}

.log-service {
  color: #6b7280;
  font-family: monospace;
}

.log-message {
  color: #374151;
}

.log-row.log-level-error {
  background: rgba(239, 68, 68, 0.05);
}

@media (max-width: 768px) {
  .logs-main {
    margin-left: 0;
    padding: 1rem;
  }

  .logs-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .logs-header h1 {
    font-size: 1.5rem;
  }

  .filter-actions {
    width: 100%;
    flex-direction: column;
  }

  .filter-select {
    width: 100% !important;
  }

  .logs-table-container {
    overflow-x: auto;
  }

  .logs-table {
    min-width: 600px;
  }
}
</style>