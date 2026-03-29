<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">🔍 Hardware Detection</h2>
        <button @click="close" class="modal-close">&times;</button>
      </div>
      
      <div class="modal-content">
        <div v-if="loading" class="loading">
          <p>Analyzing your system hardware...</p>
          <p class="hint">This may take a moment</p>
        </div>
        
        <div v-else-if="recommendations" class="recommendations-container">
          <div class="hardware-info">
            <h3>Detected Hardware</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">CPU:</span>
                <span class="info-value">{{ recommendations.detection.cpu_model || 'Unknown' }}</span>
                <span class="info-sub">{{ recommendations.detection.cpu_cores }} cores</span>
              </div>
              <div class="info-item">
                <span class="info-label">RAM:</span>
                <span class="info-value">{{ recommendations.detection.ram_gb }} GB</span>
              </div>
              <div class="info-item">
                <span class="info-label">GPU:</span>
                <span class="info-value">
                  {{ recommendations.detection.has_cuda && recommendations.detection.gpu_count > 0 
                    ? `${recommendations.detection.gpu_count} NVIDIA GPUs (${recommendations.detection.total_vram_mb} MB total)`
                    : 'No dedicated GPU detected' }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="recommendations-section">
            <h3>Recommended Build Settings</h3>
            <div class="settings-list">
              <div v-for="(value, key) in recommendations.build_recommendations" :key="'build-' + key" class="setting-item">
                <span class="setting-name">{{ formatSettingName(key) }}</span>
                <span class="setting-value">{{ formatSettingValue(value, key) }}</span>
              </div>
            </div>
          </div>
          
          <div class="recommendations-section">
            <h3>Recommended Run Settings</h3>
            <div class="settings-list">
              <div v-for="(value, key) in recommendations.run_recommendations" :key="'run-' + key" class="setting-item">
                <span class="setting-name">{{ formatSettingName(key) }}</span>
                <span class="setting-value">{{ formatSettingValue(value, key) }}</span>
              </div>
            </div>
          </div>
          
          <div class="recommendations-text">
            <h3>Recommendations</h3>
            <pre>{{ recommendations.recommendations_text }}</pre>
          </div>
          
          <div class="full-output" v-if="fullOutput">
            <h3>Detection Output</h3>
            <pre>{{ fullOutput }}</pre>
          </div>
        </div>
        
        <div v-else class="error-message">
          <p>Failed to detect hardware. Please try again.</p>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="runScript" class="btn btn-secondary" v-if="!loading && !recommendations">
          Run Hardware Detection
        </button>
        <button @click="runScript" class="btn btn-secondary" v-else-if="!loading && recommendations">
          Run Detection Script
        </button>
        <button @click="applyRecommendations" class="btn btn-primary" v-if="!loading && recommendations">
          Apply Recommendations
        </button>
        <button @click="close" class="btn btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  recommendations: Object,
  fullOutput: String,
  loading: Boolean
})

const emit = defineEmits(['close', 'apply', 'run-script'])

function close() {
  emit('close')
}

function applyRecommendations() {
  emit('apply')
}

function runScript() {
  emit('run-script')
}

function formatSettingName(key) {
  const names = {
    buildSharedLibs: 'Build Shared Libraries',
    cmakeBuildType: 'CMake Build Type',
    ggmlCcache: 'Enable ccache',
    ggmlLto: 'Enable LTO',
    ggmlNative: 'Optimize for Native CPU',
    ggmlCuda: 'CUDA Backend',
    ggmlCudaPeerMaxBatchSize: 'CUDA Peer Max Batch Size',
    ggmlCudaFa: 'Flash Attention',
    ggmlCudaGraphs: 'CUDA Graphs',
    ggmlBlast: 'BLAS Backend',
    ggmlBlastVendor: 'BLAS Vendor',
    gpuLayers: 'GPU Layers',
    splitMode: 'Split Mode',
    tensorSplit: 'Tensor Split',
    contextSize: 'Context Size',
    threads: 'Threads',
    batchSize: 'Batch Size',
    temperature: 'Temperature',
    topK: 'Top-K',
    topP: 'Top-P',
    contBatching: 'Continuous Batching'
  }
  return names[key] || key
}

function formatSettingValue(value, key) {
  if (typeof value === 'boolean') {
    return value ? '✓ Enabled' : '✗ Disabled'
  }
  if (value === 'all') {
    return 'All layers'
  }
  if (value === '') {
    return '-'
  }
  return value
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-medium);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 1.25rem;
  color: var(--color-mint-light);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-content {
  padding: 24px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.loading p {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.hint {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.recommendations-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hardware-info {
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  padding: 20px;
}

.hardware-info h3 {
  color: var(--color-mint-light);
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.info-value {
  font-weight: 600;
  color: var(--text-primary);
}

.info-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.recommendations-section {
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  padding: 20px;
}

.recommendations-section h3 {
  color: var(--color-mint-light);
  margin-bottom: 16px;
}

.settings-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: var(--bg-secondary);
  border-radius: 6px;
}

.setting-name {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.setting-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-mint-light);
}

.recommendations-text {
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  padding: 20px;
}

.recommendations-text h3 {
  color: var(--color-mint-light);
  margin-bottom: 12px;
}

.recommendations-text pre {
  white-space: pre-wrap;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.full-output {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  padding: 20px;
}

.full-output h3 {
  color: var(--color-mint-light);
  margin-bottom: 12px;
}

.full-output pre {
  white-space: pre-wrap;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: var(--text-secondary);
  max-height: 300px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-light);
}

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid var(--color-error);
  border-radius: 8px;
  padding: 24px;
  color: var(--color-error);
  text-align: center;
}
</style>
