<template>
  <div class="script-library">
    <div class="search-box">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search scripts..."
        class="form-input"
      />
    </div>
    
    <div class="filters">
      <select v-model="filterType" class="filter-select">
        <option value="all">All Types</option>
        <option value="build">Build</option>
        <option value="run">Run</option>
      </select>
      
      <select v-model="sortBy" class="filter-select">
        <option value="date">Sort by Date</option>
        <option value="name">Sort by Name</option>
      </select>
    </div>
    
    <div v-if="loading" class="loading">Loading...</div>
    
    <div v-else-if="filteredScripts.length === 0" class="empty-state">
      <div class="empty-state-icon">📄</div>
      <p>No scripts found</p>
    </div>
    
    <div v-else class="script-library">
      <div v-for="script in filteredScripts" :key="script.id" class="script-card">
        <div class="script-card-header">
          <span class="script-card-title">{{ script.name }}</span>
          <span class="script-card-type">{{ script.type }}</span>
        </div>
        
        <div class="script-card-preview">{{ script.preview }}</div>
        
        <div class="script-card-meta">
          {{ formatDate(script.createdAt || script.updatedAt) }}
        </div>
        
        <div class="script-card-actions">
          <button @click="runScript(script)" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.875rem;">
            Run
          </button>
          <button @click="editScript(script)" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.875rem;">
            Edit
          </button>
          <button @click="deleteScript(script)" class="btn btn-danger" style="padding: 8px 16px; font-size: 0.875rem;">
            Delete
          </button>
        </div>
      </div>
    </div>
    
    <ScriptPreview
      v-if="showPreview"
      :script="previewScriptContent"
      :script-name="previewScriptName"
      :script-type="previewScriptType"
      @close="showPreview = false"
      @run="executeScript"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ScriptPreview from './ScriptPreview.vue'

const emit = defineEmits(['run-script'])

const loading = ref(true)
const scripts = ref([])
const searchQuery = ref('')
const filterType = ref('all')
const sortBy = ref('date')
const showPreview = ref(false)
const previewScriptContent = ref('')
const previewScriptName = ref('')
const previewScriptType = ref('')

const filteredScripts = computed(() => {
  let result = [...scripts.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(query) ||
      (s.preview && s.preview.toLowerCase().includes(query))
    )
  }
  
  if (filterType.value !== 'all') {
    result = result.filter(s => s.type === filterType.value)
  }
  
  if (sortBy.value === 'date') {
    result.sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
  } else {
    result.sort((a, b) => a.name.localeCompare(b.name))
  }
  
  return result
})

onMounted(async () => {
  await loadScripts()
})

async function loadScripts() {
  try {
    const response = await fetch('/api/scripts/list')
    if (!response.ok) {
      throw new Error('Failed to load scripts')
    }
    scripts.value = await response.json()
  } catch (err) {
    console.error('Error loading scripts:', err)
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown date'
  return new Date(dateString).toLocaleString()
}

async function runScript(script) {
  try {
    const response = await fetch('/api/scripts/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scriptPath: script.path
      })
    })
    
    const result = await response.json()
    if (result.success) {
      alert('Script executed successfully!')
    } else {
      alert(`Error: ${result.error || result.stderr}`)
    }
  } catch (err) {
    alert(`Error executing script: ${err.message}`)
  }
}

async function editScript(script) {
  try {
    const response = await fetch(`/api/scripts/${script.id}?type=${script.type}`)
    if (!response.ok) {
      throw new Error('Failed to load script')
    }
    const data = await response.json()
    previewScriptContent.value = data.content
    previewScriptName.value = script.name
    previewScriptType.value = script.type
    showPreview.value = true
  } catch (err) {
    alert(`Error: ${err.message}`)
  }
}

async function deleteScript(script) {
  if (!confirm(`Are you sure you want to delete "${script.name}"?`)) {
    return
  }
  
  try {
    const response = await fetch(`/api/scripts/${script.id}?type=${script.type}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete script')
    }
    
    await loadScripts()
  } catch (err) {
    alert(`Error: ${err.message}`)
  }
}

async function executeScript(scriptType, scriptName, scriptContent) {
  showPreview.value = false
  
  const dir = scriptType === 'build' ? 'builds' : 'runs'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const uniqueName = `${scriptName}-${timestamp}`
  
  try {
    const saveResponse = await fetch('/api/scripts/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: uniqueName,
        type: scriptType,
        content: scriptContent
      })
    })
    
    if (!saveResponse.ok) {
      throw new Error('Failed to save script')
    }
    
    const saveData = await saveResponse.json()
    
    const executeResponse = await fetch('/api/scripts/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scriptPath: saveData.path
      })
    })
    
    const result = await executeResponse.json()
    if (result.success) {
      alert('Script executed successfully!')
    } else {
      alert(`Error: ${result.error || result.stderr}`)
    }
    
    await loadScripts()
  } catch (err) {
    alert(`Error: ${err.message}`)
  }
}
</script>

<style scoped>
.script-library {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.search-box {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.script-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.script-card:hover {
  border-color: var(--color-mint);
  transform: translateY(-2px);
}

.script-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.script-card-title {
  font-weight: 600;
  color: var(--color-mint-light);
  font-size: 1.1rem;
}

.script-card-type {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.script-card-type.build {
  background-color: var(--color-info);
  color: var(--color-white);
}

.script-card-type.run {
  background-color: var(--color-success);
  color: var(--color-white);
}

.script-card-preview {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 16px;
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.script-card-meta {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.script-card-actions {
  display: flex;
  gap: 8px;
}
</style>
