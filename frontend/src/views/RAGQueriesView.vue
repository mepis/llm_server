<template>
  <div class="queries-container">
    <Header />
    <Sidebar />
    <main class="queries-main">
      <div class="queries-header">
        <h1>Knowledge Search</h1>
      </div>

      <div class="search-box">
        <input
          v-model="searchQuery"
          @keydown.enter.prevent="performSearch"
          type="text"
          placeholder="Search your documents..."
          :disabled="searching"
        />
        <Button
          label="Search"
          icon="pi pi-search"
          @click="performSearch"
          :disabled="!searchQuery.trim() || searching"
        />
      </div>

      <div v-if="searching" class="loading-state">
        <p>Searching documents...</p>
      </div>

      <div v-else-if="results.length === 0 && !hasSearched" class="empty-state">
        <p>Enter a query to search your uploaded documents</p>
      </div>

      <div v-else-if="results.length === 0" class="no-results">
        <p>No results found for "{{ searchQuery }}"</p>
      </div>

      <div v-else class="results-list">
        <div v-for="(result, index) in results" :key="index" class="result-item">
          <div class="result-rank">{{ index + 1 }}</div>
          <div class="result-content">
            <div class="result-score">Score: {{ (result.score * 100).toFixed(1) }}%</div>
            <p class="result-text">{{ result.content }}</p>
            <div class="result-meta">
              <span>Document: {{ result.document_id }}</span>
              <span>Chunk: {{ result.chunk_index }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRAGStore } from '@/stores/rag'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Button from 'primevue/button'

const ragStore = useRAGStore()
const searchQuery = ref('')
const searching = ref(false)
const results = ref([])
const hasSearched = ref(false)

const performSearch = async () => {
  if (!searchQuery.value.trim()) return

  searching.value = true
  hasSearched.value = true
  results.value = []

  try {
    const response = await ragStore.searchDocuments(searchQuery.value)
    results.value = response || []
  } catch (error) {
    console.error('Search failed:', error)
    alert('Search failed: ' + (error.response?.data?.message || error.message))
  } finally {
    searching.value = false
  }
}
</script>

<style scoped>
.queries-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.queries-main {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.queries-header {
  margin-bottom: 2rem;
}

.queries-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.search-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-box input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.search-box input:focus {
  outline: none;
  border-color: #2d6a4f;
}

.loading-state,
.empty-state,
.no-results {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.result-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2d6a4f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.result-content {
  flex: 1;
}

.result-score {
  font-size: 0.75rem;
  font-weight: 600;
  color: #2d6a4f;
  margin-bottom: 0.5rem;
}

.result-text {
  color: #374151;
  line-height: 1.6;
  margin: 0 0 0.75rem 0;
}

.result-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>