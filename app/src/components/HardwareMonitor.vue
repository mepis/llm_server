<template>
  <div class="hardware-monitor">
    <div v-if="error" class="error-message">{{ error }}</div>
    
    <div v-if="!error" class="stats-container">
      <div class="stats-section">
        <h2>CPU Usage</h2>
        <div class="stats-grid">
          <div class="stat-card" v-for="core in stats.cpu.cores" :key="core.id">
            <div class="stat-header">
              <span class="stat-label">Core {{ core.id }}</span>
              <span :class="['status-indicator', getStatusClass(core.usage)]"></span>
            </div>
            <div class="stat-value">{{ core.usage }}%</div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${core.usage}%` }"
                :class="getProgressClass(core.usage)"
              ></div>
            </div>
          </div>
          <div class="stat-card stat-card-large">
            <div class="stat-header">
              <span class="stat-label">Average</span>
              <span :class="['status-indicator', getStatusClass(stats.cpu.total)]"></span>
            </div>
            <div class="stat-value">{{ stats.cpu.total }}%</div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${stats.cpu.total}%` }"
                :class="getProgressClass(stats.cpu.total)"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="stats-section">
        <h2>Memory Usage</h2>
        <div class="stats-row">
          <div class="stat-card stat-card-large">
            <div class="stat-header">
              <span class="stat-label">RAM</span>
              <span :class="['status-indicator', getStatusClass(stats.memory.percent)]"></span>
            </div>
            <div class="stat-value">{{ stats.memory.percent }}%</div>
            <div class="stat-absolute">{{ stats.memory.used }}GB / {{ stats.memory.total }}GB</div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${stats.memory.percent}%` }"
                :class="getProgressClass(stats.memory.percent)"
              ></div>
            </div>
          </div>
          <div class="stat-card stat-card-large">
            <div class="stat-header">
              <span class="stat-label">Swap</span>
              <span :class="['status-indicator', getStatusClass(stats.swap.percent)]"></span>
            </div>
            <div class="stat-value">{{ stats.swap.percent }}%</div>
            <div class="stat-absolute">{{ stats.swap.used }}GB / {{ stats.swap.total }}GB</div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${stats.swap.percent}%` }"
                :class="getProgressClass(stats.swap.percent)"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="stats-section">
        <h2>Historical Trends (Last 60 seconds)</h2>
        <div class="chart-container">
          <canvas ref="cpuChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas ref="memoryChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas ref="swapChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const stats = ref({
  cpu: { cores: [], total: 0, count: 0 },
  memory: { used: 0, total: 0, percent: 0 },
  swap: { used: 0, total: 0, percent: 0 },
  timestamp: ''
})

const history = ref({
  cpu: [],
  memory: [],
  swap: [],
  timestamps: []
})

const loading = ref(true)
const error = ref('')

let pollInterval = null
let cpuChartInstance = null
let memoryChartInstance = null
let swapChartInstance = null

const getStatusClass = (percent) => {
  if (percent >= 85) return 'status-critical'
  if (percent >= 70) return 'status-warning'
  return 'status-ok'
}

const getProgressClass = (percent) => {
  if (percent >= 85) return 'progress-critical'
  if (percent >= 70) return 'progress-warning'
  return 'progress-ok'
}

const fetchStats = async () => {
  try {
    loading.value = true
    const response = await fetch('/api/hardware/stats')
    const data = await response.json()
    
    if (data.error) {
      error.value = data.error
      loading.value = false
      return
    }
    
    stats.value = data
    
    const timestamp = new Date(data.timestamp).toLocaleTimeString()
    history.value.timestamps.push(timestamp)
    history.value.cpu.push(data.cpu.total)
    history.value.memory.push(data.memory.percent)
    history.value.swap.push(data.swap.percent)
    
    if (history.value.timestamps.length > 60) {
      history.value.timestamps.shift()
      history.value.cpu.shift()
      history.value.memory.shift()
      history.value.swap.shift()
    }
    
    updateCharts()
    loading.value = false
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
}

const createChart = (ctx, label, data, color, width, height) => {
  const chart = {
    ctx,
    data: [],
    label,
    color,
    max: 100,
    width,
    height
  }
  
  const draw = () => {
    const { ctx, data, color, max, width, height } = chart
    ctx.clearRect(0, 0, width, height)
    
    if (data.length < 2) {
      ctx.fillStyle = '#666'
      ctx.font = '12px monospace'
      ctx.fillText('Waiting for data...', 10, height / 2)
      return
    }
    
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const stepX = width / (data.length - 1)
    const maxVal = max
    
    data.forEach((val, i) => {
      const x = i * stepX
      const y = height - (val / maxVal) * height - 10
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.stroke()
    
    ctx.fillStyle = color
    ctx.font = '12px monospace'
    ctx.fillText(`${label} Usage`, 10, 20)
  }
  
  chart.draw = draw
  return chart
}

const updateCharts = () => {
  if (!cpuChartInstance || !memoryChartInstance || !swapChartInstance) return
  
  const { timestamps, cpu, memory, swap } = history.value
  
  cpuChartInstance.data = [...cpu]
  cpuChartInstance.draw()
  
  memoryChartInstance.data = [...memory]
  memoryChartInstance.draw()
  
  swapChartInstance.data = [...swap]
  swapChartInstance.draw()
}

const initCharts = () => {
  const initChart = (canvas, label, color) => {
    if (!canvas) return null
    
    const ctx = canvas.getContext('2d')
    const rect = canvas.parentElement.getBoundingClientRect()
    const width = Math.floor(rect.width - 30)
    const height = 150
    canvas.width = width
    canvas.height = height
    
    return createChart(ctx, label, [], color, width, height)
  }
  
  cpuChartInstance = initChart(cpuChart.value, 'CPU', '#10b981')
  memoryChartInstance = initChart(memoryChart.value, 'Memory', '#3b82f6')
  swapChartInstance = initChart(swapChart.value, 'Swap', '#f59e0b')
}

const handleResize = () => {
  updateChartDimensions()
  updateCharts()
}

const updateChartDimensions = () => {
  const updateChart = (chartInstance, canvas) => {
    if (!chartInstance || !canvas) return
    const rect = canvas.parentElement.getBoundingClientRect()
    chartInstance.width = Math.floor(rect.width - 30)
    chartInstance.height = 150
    canvas.width = chartInstance.width
    canvas.height = chartInstance.height
  }
  
  updateChart(cpuChartInstance, cpuChart.value)
  updateChart(memoryChartInstance, memoryChart.value)
  updateChart(swapChartInstance, swapChart.value)
}

onMounted(async () => {
  fetchStats()
  pollInterval = setInterval(fetchStats, 5000)
  
  await nextTick()
  initCharts()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.hardware-monitor {
  width: 100%;
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.stats-section {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
}

.stats-section h2 {
  font-size: 1.25rem;
  color: var(--color-mint-light);
  margin-bottom: 20px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stat-card {
  background-color: var(--bg-tertiary);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid var(--border-light);
}

.stat-card-large {
  min-width: 250px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-ok {
  background-color: var(--color-success);
}

.status-warning {
  background-color: var(--color-warning);
}

.status-critical {
  background-color: var(--color-error);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-white);
  margin-bottom: 4px;
}

.stat-absolute {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.progress-bar {
  height: 8px;
  background-color: var(--bg-primary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.progress-ok {
  background-color: var(--color-success);
}

.progress-warning {
  background-color: var(--color-warning);
}

.progress-critical {
  background-color: var(--color-error);
}

.chart-container {
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--bg-tertiary);
  border-radius: 10px;
  border: 1px solid var(--border-light);
}

.chart-container canvas {
  display: block;
  width: 100%;
  height: 150px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .stat-card-large {
    min-width: unset;
  }
}
</style>
