<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../services/api';

const models = ref([]);
const searchQuery = ref('');
const searchResults = ref([]);
const loading = ref(false);
const searching = ref(false);
const downloading = ref({});

async function fetchModels() {
  try {
    loading.value = true;
    const response = await api.getModels();
    models.value = response.data.data || [];
  } catch (err) {
    console.error('Failed to fetch models:', err);
  } finally {
    loading.value = false;
  }
}

async function searchHuggingFace() {
  if (!searchQuery.value.trim()) return;

  try {
    searching.value = true;
    const response = await api.searchHuggingFace(searchQuery.value);
    searchResults.value = response.data.data || [];
  } catch (err) {
    console.error('Failed to search HuggingFace:', err);
  } finally {
    searching.value = false;
  }
}

async function downloadModel(modelName) {
  try {
    downloading.value[modelName] = true;
    await api.downloadModel(modelName);
    await fetchModels();
  } catch (err) {
    console.error(`Failed to download model ${modelName}:`, err);
  } finally {
    downloading.value[modelName] = false;
  }
}

async function deleteModel(modelId) {
  if (!confirm('Are you sure you want to delete this model?')) return;

  try {
    await api.deleteModel(modelId);
    await fetchModels();
  } catch (err) {
    console.error(`Failed to delete model ${modelId}:`, err);
  }
}

onMounted(() => {
  fetchModels();
});

const localModels = computed(() => {
  return models.value.filter(m => m.downloaded);
});

function formatBytes(bytes) {
  if (!bytes) return 'N/A';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}
</script>

<template>
  <div class="models-page">
    <div class="page-header">
      <h1>Models Management</h1>
      <p class="subtitle">Download and manage LLM models from HuggingFace</p>
    </div>

    <div class="models-content">
      <!-- Search Section -->
      <div class="card search-card">
        <h3>Search HuggingFace Models</h3>
        <div class="search-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search for models (e.g., llama, mistral, phi)..."
            class="search-input"
            @keyup.enter="searchHuggingFace"
          />
          <button
            class="btn btn-primary"
            @click="searchHuggingFace"
            :disabled="searching || !searchQuery.trim()"
          >
            {{ searching ? 'Searching...' : 'Search' }}
          </button>
        </div>

        <div v-if="searchResults.length > 0" class="search-results">
          <h4>Search Results</h4>
          <div class="results-grid">
            <div
              v-for="result in searchResults"
              :key="result.id"
              class="result-card"
            >
              <div class="result-header">
                <h5>{{ result.name }}</h5>
                <span v-if="result.downloads" class="downloads">
                  {{ result.downloads }} downloads
                </span>
              </div>
              <p v-if="result.description" class="result-description">
                {{ result.description }}
              </p>
              <div class="result-footer">
                <span v-if="result.size" class="result-size">
                  {{ formatBytes(result.size) }}
                </span>
                <button
                  class="btn btn-sm btn-primary"
                  @click="downloadModel(result.name)"
                  :disabled="downloading[result.name]"
                >
                  {{ downloading[result.name] ? 'Downloading...' : 'Download' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Local Models Section -->
      <div class="card models-card">
        <h3>Local Models</h3>

        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading models...</p>
        </div>

        <div v-else-if="localModels.length === 0" class="empty-state">
          <p>No models downloaded yet</p>
          <p class="hint">Search and download models from HuggingFace above</p>
        </div>

        <div v-else class="models-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Type</th>
                <th>Downloaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="model in localModels" :key="model.id">
                <td>
                  <div class="model-name">
                    <span class="name">{{ model.name }}</span>
                    <span v-if="model.path" class="path">{{ model.path }}</span>
                  </div>
                </td>
                <td>{{ formatBytes(model.size) }}</td>
                <td>
                  <span class="badge badge-info">{{ model.type || 'GGUF' }}</span>
                </td>
                <td>{{ formatDate(model.downloadedAt) }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      class="btn btn-sm btn-secondary"
                      @click="deleteModel(model.id)"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.models-page {
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

.models-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-card h3,
.models-card h3 {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.search-container {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #2dd4bf;
}

.search-results {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.search-results h4 {
  font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.result-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.result-card:hover {
  border-color: #a0e7d8;
  box-shadow: 0 2px 8px rgba(45, 212, 191, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.5rem;
}

.result-header h5 {
  font-size: 1rem;
  color: #2c3e50;
  margin: 0;
  flex: 1;
}

.downloads {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

.result-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-size {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 600;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
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
  padding: 3rem;
  color: #6b7280;
}

.hint {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.models-table {
  overflow-x: auto;
}

.models-table table {
  width: 100%;
  border-collapse: collapse;
}

.models-table th {
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

.models-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  color: #2c3e50;
}

.models-table tbody tr:hover {
  background: #f8fffe;
}

.model-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.model-name .name {
  font-weight: 600;
  color: #2c3e50;
}

.model-name .path {
  font-size: 0.875rem;
  color: #6b7280;
  font-family: 'Courier New', monospace;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
</style>
