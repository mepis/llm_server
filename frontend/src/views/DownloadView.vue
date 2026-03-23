<template>
  <div class="container">
    <div class="header">
      <h1>Downloads</h1>
      <button @click="refreshDownloads" class="btn btn-secondary">Refresh</button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="downloads.length === 0" class="card">
      <p>No downloads found. Start a download from the Models page.</p>
    </div>

    <div v-else class="grid">
      <div v-for="download in downloads" :key="download.jobId" class="card">
        <h3>
          {{ download.modelId.split('/').pop() }}
        </h3>
        <p class="meta">Status: {{ formatStatus(download.status) }}</p>
        <div class="progress-section">
          <div class="progress-bar">
            <div
              class="progress-bar-fill"
              :style="{ width: `${download.progress}%` }"
            ></div>
          </div>
          <p class="progress-text">{{ download.progress }}%</p>
        </div>
        <p class="meta">Created: {{ new Date(download.created).toLocaleString() }}</p>
        <div v-if="download.status === 'completed'" class="success">
          Download completed successfully
        </div>
        <div v-else-if="download.status === 'failed'" class="error">
          Download failed
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useModels } from '../composables/useModels';

const {
  downloads,
  loading,
  error,
  listDownloads
} = useModels();

let intervalId = null;

onMounted(() => {
  refreshDownloads();
  intervalId = setInterval(refreshDownloads, 5000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});

const refreshDownloads = async () => {
  try {
    await listDownloads();
  } catch (err) {
    console.error('Failed to refresh downloads:', err);
  }
};

const formatStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.card h3 {
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.card .meta {
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.progress-section {
  margin: 1rem 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  background-color: #3b82f6;
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  font-weight: 500;
}

.grid {
  display: grid;
  gap: 1rem;
}
</style>
