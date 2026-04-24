<template>
  <div class="memories-container">
    <main class="memories-main">
      <div class="memories-header">
        <h1>User Memory</h1>
        <div class="header-actions">
          <Select v-model="selectedSession" :options="sessions" optionLabel="session_name" placeholder="Select session to extract" />
          <Button label="Extract Memories" icon="pi pi-database" @click="extractMemories()" :disabled="!selectedSession" />
        </div>
      </div>

      <Tabs :value="activeTab" @update:value="activeTab = $event">
        <TabList>
          <Tab value="episodic">Episodic</Tab>
          <Tab value="semantic">Semantic</Tab>
          <Tab value="procedural">Procedural</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="episodic">
            <div v-if="memoryStore.loading" class="loading-state">
              <p>Loading episodic memories...</p>
            </div>
            <div v-else-if="episodic.length === 0" class="empty-state">
              <p>No episodic memories found.</p>
            </div>
            <div v-else class="memories-list">
              <div v-for="memory in episodic" :key="memory._id" class="memory-item">
                <div class="memory-content">{{ memory.content }}</div>
                <div class="memory-meta">
                  <Badge :value="'episodic'" severity="info" />
                  <span>{{ formatDate(memory.created_at) }}</span>
                  <span v-if="memory.metadata?.expires_at">Expires: {{ formatDate(memory.metadata.expires_at) }}</span>
                  <span>Confidence: {{ (memory.metadata?.confidence * 100).toFixed(0) }}%</span>
                  <Button icon="pi pi-trash" text severity="danger" size="small" @click="deleteMemory(memory._id)" />
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel value="semantic">
            <div class="search-bar">
              <InputText v-model="semanticQuery" placeholder="Search semantic memories..." @keyup.enter="searchSemantic()" />
              <Button label="Search" icon="pi pi-search" @click="searchSemantic()" />
            </div>
            <div v-if="memoryStore.loading" class="loading-state">
              <p>Loading semantic memories...</p>
            </div>
            <div v-else-if="semantic.length === 0" class="empty-state">
              <p>No semantic memories found.</p>
            </div>
            <div v-else class="memories-list">
              <div v-for="memory in semantic" :key="memory._id" class="memory-item">
                <div class="memory-content">{{ memory.content }}</div>
                <div class="memory-meta">
                  <Badge :value="'semantic'" severity="warn" />
                  <span>{{ formatDate(memory.created_at) }}</span>
                  <span v-for="keyword in (memory.metadata?.keywords || [])" :key="keyword" class="keyword-tag">{{ keyword }}</span>
                  <span>Confidence: {{ (memory.metadata?.confidence * 100).toFixed(0) }}%</span>
                  <Button icon="pi pi-trash" text severity="danger" size="small" @click="deleteMemory(memory._id)" />
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel value="procedural">
            <div v-if="memoryStore.loading" class="loading-state">
              <p>Loading procedural memories...</p>
            </div>
            <div v-else-if="procedural.length === 0" class="empty-state">
              <p>No procedural memories found. These will be extracted from your conversation preferences.</p>
            </div>
            <div v-else class="memories-list">
              <div v-for="memory in procedural" :key="memory._id" class="memory-item">
                <div class="memory-content">{{ memory.content }}</div>
                <div class="memory-meta">
                  <Badge :value="'procedural'" severity="success" />
                  <span>{{ formatDate(memory.created_at) }}</span>
                  <span v-for="keyword in (memory.metadata?.keywords || [])" :key="keyword" class="keyword-tag">{{ keyword }}</span>
                  <span>Confidence: {{ (memory.metadata?.confidence * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMemoryStore } from '@/stores/memory'
import { useRouter } from 'vue-router'

const memoryStore = useMemoryStore()
const router = useRouter()

const activeTab = ref('episodic')
const semanticQuery = ref('')
const selectedSession = ref(null)
const sessions = ref([])

const episodic = computed(() => memoryStore.episodic)
const semantic = computed(() => memoryStore.semantic)
const procedural = computed(() => memoryStore.procedural)

onMounted(async () => {
  await loadMemories()
  await fetchSessions()
})

const loadMemories = async () => {
  try {
    await Promise.all([
      memoryStore.fetchEpisodic(),
      memoryStore.fetchSemantic(),
      memoryStore.fetchProcedural()
    ])
  } catch (error) {
    console.error('Failed to load memories:', error)
  }
}

const fetchSessions = async () => {
  try {
    const response = await fetch('/api/chat/sessions?page=1&limit=50', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await response.json()
    sessions.value = data.data?.sessions || []
  } catch (error) {
    console.error('Failed to fetch sessions:', error)
  }
}

const searchSemantic = async () => {
  try {
    await memoryStore.fetchSemantic(semanticQuery.value)
  } catch (error) {
    console.error('Failed to search semantic memories:', error)
  }
}

const extractMemories = async () => {
  if (!selectedSession.value?._id) return
  try {
    const result = await memoryStore.extractMemories(selectedSession.value._id)
    console.log('Extraction result:', result)
    await loadMemories()
  } catch (error) {
    console.error('Failed to extract memories:', error)
  }
}

const deleteMemory = async (id) => {
  try {
    await memoryStore.deleteMemory(id)
  } catch (error) {
    console.error('Failed to delete memory:', error)
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}
</script>

<style scoped>
.memories-container {
  padding: 2rem;
}

.memories-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.memories-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.memory-item {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1rem;
}

.memory-content {
  margin-bottom: 0.5rem;
}

.memory-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  flex-wrap: wrap;
}

.keyword-tag {
  background: var(--surface-ground);
  padding: 2px 8px;
  border-radius: 12px;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}
</style>
