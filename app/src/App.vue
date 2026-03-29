<template>
  <div class="app">
    <aside class="sidebar">
      <div class="sidebar-header">🦙 Llama Manager</div>
      <nav>
        <ul class="nav-menu">
          <li class="nav-item">
            <a :class="{ active: currentView === 'build' }" class="nav-link" @click="currentView = 'build'">
              Build Script
            </a>
          </li>
          <li class="nav-item">
            <a :class="{ active: currentView === 'run' }" class="nav-link" @click="currentView = 'run'">
              Run Script
            </a>
          </li>
          <li class="nav-item">
            <a :class="{ active: currentView === 'library' }" class="nav-link" @click="currentView = 'library'">
              Script Library
            </a>
          </li>
          <li class="nav-item">
            <a :class="{ active: currentView === 'hardware' }" class="nav-link" @click="currentView = 'hardware'">
              Hardware Monitor
            </a>
          </li>
        </ul>
      </nav>
    </aside>
    
    <main class="main-content">
      <div class="header">
        <h1 v-if="currentView === 'build'">Build Script Generator</h1>
        <h1 v-else-if="currentView === 'run'">Run Script Generator</h1>
        <h1 v-else-if="currentView === 'library'">Script Library</h1>
        <h1 v-else>Hardware Monitor</h1>
        <p v-if="currentView === 'build'">
          Create build configurations for llama.cpp compilation
        </p>
        <p v-else-if="currentView === 'run'">
          Create runtime configurations for llama-server execution
        </p>
        <p v-else-if="currentView === 'library'">
          Browse and manage your saved scripts
        </p>
        <p v-else>
          Real-time CPU, memory, and swap usage monitoring
        </p>
      </div>
      
      <BuildForm v-if="currentView === 'build'" @preview="showPreview" />
       <RunForm v-else-if="currentView === 'run'" @preview="showPreview" />
       <ScriptLibrary v-else-if="currentView === 'library'" @run-script="executeScript" />
       <HardwareMonitor v-else />
      
      <ScriptPreview
        v-if="showPreviewModal"
        :script="previewContent"
        :script-name="previewName"
        :script-type="previewType"
        @close="showPreviewModal = false"
        @run="executeScript"
      />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BuildForm from './components/BuildForm.vue'
import RunForm from './components/RunForm.vue'
import ScriptLibrary from './components/ScriptLibrary.vue'
import ScriptPreview from './components/ScriptPreview.vue'
import HardwareMonitor from './components/HardwareMonitor.vue'

const currentView = ref('build')
const showPreviewModal = ref(false)
const previewContent = ref('')
const previewName = ref('')
const previewType = ref('')

function showPreview(script) {
  previewContent.value = script
  previewName.value = `script-${Date.now()}`
  previewType.value = currentView.value === 'build' ? 'build' : 'run'
  showPreviewModal.value = true
}

async function executeScript(scriptType, scriptName, scriptContent) {
  showPreviewModal.value = false
  
  const dir = scriptType === 'build' ? 'builds' : 'runs'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const uniqueName = `${scriptName || 'script'}-${timestamp}`
  
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
  } catch (err) {
    alert(`Error: ${err.message}`)
  }
}
</script>

<style>
.app {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background-color: var(--bg-secondary);
  padding: 20px;
  border-right: 1px solid var(--border-light);
}

.sidebar-header {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-mint-light);
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}

.nav-menu {
  list-style: none;
}

.nav-item {
  margin-bottom: 8px;
}

.nav-link {
  display: block;
  padding: 12px 16px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-link:hover, .nav-link.active {
  background-color: var(--color-mint-dark);
  color: var(--color-white);
}

.main-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2rem;
  color: var(--color-mint-light);
  margin-bottom: 8px;
}

.header p {
  color: var(--text-muted);
}
</style>
