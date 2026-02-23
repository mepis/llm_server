<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from '../services/api';
import { formatDate } from '../utils/formatting.js';
import { getBuildStatusBadge } from '../utils/statusHelpers.js';
import { POLLING } from '../config/constants.js';

const buildStatus = ref(null);
const buildHistory = ref([]);
const buildOutput = ref([]);
const loading = ref(false);
const building = ref(false);
const selectedBuildType = ref('auto');
let outputInterval = null;
let currentBuildId = null;

const buildTypes = [
  { value: 'auto', label: 'Auto-detect', description: 'Automatically select best build type' },
  { value: 'cpu', label: 'CPU', description: 'CPU-only build with AVX optimizations' },
  { value: 'cuda', label: 'CUDA', description: 'NVIDIA GPU acceleration' },
  { value: 'rocm', label: 'ROCm', description: 'AMD GPU acceleration' }
];

async function fetchBuildStatus() {
  try {
    const response = await api.getBuildStatus();
    buildStatus.value = response.data;
  } catch (err) {
    console.error('Failed to fetch build status:', err);
  }
}

async function fetchBuildHistory() {
  try {
    const response = await api.getBuildHistory();
    buildHistory.value = response.data || [];
  } catch (err) {
    console.error('Failed to fetch build history:', err);
  }
}

async function startBuild() {
  if (building.value) return;

  try {
    loading.value = true;
    building.value = true;
    buildOutput.value = [];

    const response = await api.buildLlama(selectedBuildType.value);
    currentBuildId = response.data.buildId;

    // Start polling for output
    outputInterval = setInterval(fetchBuildOutput, POLLING.BUILD_OUTPUT);
  } catch (err) {
    console.error('Failed to start build:', err);
    building.value = false;
    loading.value = false;
  }
}

async function fetchBuildOutput() {
  if (!currentBuildId) return;

  try {
    const response = await api.getBuildOutput(currentBuildId);
    const data = response.data;

    if (data.output && data.output.length > 0) {
      buildOutput.value = data.output;
    }

    if (data.status === 'completed' || data.status === 'failed') {
      building.value = false;
      loading.value = false;
      if (outputInterval) {
        clearInterval(outputInterval);
        outputInterval = null;
      }
      await fetchBuildHistory();
      await fetchBuildStatus();
    }
  } catch (err) {
    console.error('Failed to fetch build output:', err);
  }
}

async function cloneRepository() {
  try {
    loading.value = true;
    await api.cloneLlama();
    await fetchBuildStatus();
  } catch (err) {
    console.error('Failed to clone repository:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchBuildStatus();
  await fetchBuildHistory();
});

onUnmounted(() => {
  if (outputInterval) {
    clearInterval(outputInterval);
  }
});
</script>

<template>
  <div class="build-page">
    <div class="page-header">
      <h1>Build Management</h1>
      <p class="subtitle">Manage llama.cpp builds and compilation</p>
    </div>

    <div class="build-content">
      <!-- Build Actions -->
      <div class="card action-card">
        <h3>Build llama.cpp</h3>

        <div class="build-type-selector">
          <label class="form-label">Build Type:</label>
          <div class="build-types">
            <label
              v-for="type in buildTypes"
              :key="type.value"
              class="build-type-option"
              :class="{ selected: selectedBuildType === type.value }"
            >
              <input
                type="radio"
                v-model="selectedBuildType"
                :value="type.value"
                :disabled="building"
              />
              <div class="option-content">
                <span class="option-label">{{ type.label }}</span>
                <span class="option-description">{{ type.description }}</span>
              </div>
            </label>
          </div>
        </div>

        <div class="action-buttons">
          <button
            class="btn btn-primary"
            @click="startBuild"
            :disabled="building || loading"
          >
            {{ building ? 'Building...' : 'Start Build' }}
          </button>
          <button
            class="btn btn-secondary"
            @click="cloneRepository"
            :disabled="building || loading"
          >
            Clone Repository
          </button>
        </div>

        <div v-if="buildStatus" class="build-info">
          <div class="info-row">
            <span class="label">Repository Status:</span>
            <span :class="buildStatus.cloned ? 'badge badge-success' : 'badge badge-warning'">
              {{ buildStatus.cloned ? 'Cloned' : 'Not Cloned' }}
            </span>
          </div>
          <div v-if="buildStatus.cloned" class="info-row">
            <span class="label">Last Built:</span>
            <span class="value">{{ formatDate(buildStatus.lastBuild) || 'Never' }}</span>
          </div>
        </div>
      </div>

      <!-- Build Output -->
      <div v-if="building || buildOutput.length > 0" class="card output-card">
        <h3>Build Output</h3>
        <div class="output-container">
          <div
            v-for="(line, index) in buildOutput"
            :key="index"
            class="output-line"
            :class="line.type"
          >
            {{ line.data }}
          </div>
          <div v-if="building" class="output-line building">
            <span class="spinner-small"></span> Building...
          </div>
        </div>
      </div>

      <!-- Build History -->
      <div class="card history-card">
        <h3>Build History</h3>
        <div v-if="buildHistory.length === 0" class="empty-state">
          <p>No build history available</p>
        </div>
        <div v-else class="history-table">
          <table>
            <thead>
              <tr>
                <th>Build Type</th>
                <th>Status</th>
                <th>Started</th>
                <th>Completed</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="build in buildHistory" :key="build.id">
                <td>
                  <span class="build-type-badge">{{ build.buildType || 'N/A' }}</span>
                </td>
                <td>
                  <span class="badge" :class="getBuildStatusBadge(build.status)">
                    {{ build.status || 'unknown' }}
                  </span>
                </td>
                <td>{{ formatDate(build.startedAt) }}</td>
                <td>{{ formatDate(build.completedAt) }}</td>
                <td>{{ build.duration ? Math.round(build.duration / 1000) + 's' : 'N/A' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.build-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.build-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.action-card h3,
.output-card h3,
.history-card h3 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.build-type-selector {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.build-types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.build-type-option {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.build-type-option:hover {
  border-color: #a0e7d8;
  background: #f8fffe;
}

.build-type-option.selected {
  border-color: #2dd4bf;
  background: #d4f4ed;
}

.build-type-option input[type="radio"] {
  margin-right: 0.75rem;
}

.option-content {
  display: flex;
  flex-direction: column;
}

.option-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.option-description {
  font-size: 0.875rem;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.build-info {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.info-row .label {
  color: #6b7280;
  font-weight: 500;
}

.info-row .value {
  color: #2c3e50;
  font-weight: 600;
}

.output-container {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  max-height: 400px;
  overflow-y: auto;
}

.output-line {
  padding: 0.25rem 0;
  line-height: 1.5;
}

.output-line.stderr {
  color: #f87171;
}

.output-line.building {
  color: #5dd4bf;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner-small {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid #444;
  border-top-color: #5dd4bf;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.history-table {
  overflow-x: auto;
}

.history-table table {
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  text-align: left;
  padding: 0.75rem;
  background: #f3f4f6;
  color: #6b7280;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
}

.history-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #2c3e50;
}

.history-table tbody tr:hover {
  background: #f8fffe;
}

.build-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
