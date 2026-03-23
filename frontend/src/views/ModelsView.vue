<template>
  <div class="container">
    <div class="header">
      <h1>Models</h1>
    </div>

    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search for models..."
        @keyup.enter="handleSearch"
      />
      <button @click="handleSearch" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Searching...' : 'Search' }}
      </button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="searchResults.length === 0 && !searchPerformed" class="card">
      <p>Search for models on Hugging Face to get started.</p>
    </div>

    <div v-else class="grid grid-3">
      <div v-for="model in searchResults" :key="model.id" class="card">
        <h3>{{ model.name }}</h3>
        <p class="meta">Author: {{ model.author || 'Unknown' }}</p>
        <p class="meta">Downloads: {{ model.downloads.toLocaleString() }}</p>
        <p class="meta">Likes: {{ model.likes }}</p>
        <div class="actions">
          <button @click="handleViewDetails(model.id)" class="btn btn-secondary">View Details</button>
          <button @click="handleDownload(model.id)" class="btn btn-success">Download</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailsModal" class="modal">
      <div class="modal-content">
        <h3>Model Details</h3>
        <div v-if="currentModel">
          <p><strong>Name:</strong> {{ currentModel.name }}</p>
          <p><strong>Author:</strong> {{ currentModel.author }}</p>
          <p><strong>Downloads:</strong> {{ currentModel.downloads.toLocaleString() }}</p>
          <p><strong>Likes:</strong> {{ currentModel.likes }}</p>
          <p><strong>Description:</strong> {{ currentModel.description || 'No description' }}</p>
          <p><strong>Files:</strong></p>
          <ul>
            <li v-for="file in currentModel.files" :key="file">{{ file }}</li>
          </ul>
          <div class="modal-actions">
            <button @click="handleDownload(currentModel.id)" class="btn btn-success">Download</button>
            <button @click="showDetailsModal = false" class="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useModels } from '../composables/useModels';

const {
  searchResults,
  currentModel,
  loading,
  error,
  searchModels,
  getModelDetails,
  downloadModel
} = useModels();

const searchQuery = ref('');
const searchPerformed = ref(false);
const showDetailsModal = ref(false);

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return;
  searchPerformed.value = true;
  try {
    await searchModels(searchQuery.value);
  } catch (err) {
    console.error('Failed to search:', err);
  }
};

const handleViewDetails = async (modelId) => {
  try {
    await getModelDetails(modelId);
    showDetailsModal.value = true;
  } catch (err) {
    console.error('Failed to load model details:', err);
  }
};

const handleDownload = async (modelId) => {
  try {
    await downloadModel(modelId);
  } catch (err) {
    console.error('Failed to download:', err);
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.search-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-box input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.grid {
  display: grid;
  gap: 1rem;
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 768px) {
  .grid-3 {
    grid-template-columns: 1fr;
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
}

.modal-content p {
  margin-bottom: 0.5rem;
}

.modal-content ul {
  margin: 1rem 0;
  padding-left: 2rem;
}

.modal-content li {
  margin-bottom: 0.25rem;
  font-family: monospace;
  font-size: 0.85rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
