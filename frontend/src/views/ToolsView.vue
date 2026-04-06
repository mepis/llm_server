<template>
  <div class="tools-container">
    <Header />
    <Sidebar />
    <main class="tools-main">
      <div class="tools-header">
        <h1>Tool Builder</h1>
        <Button label="New Tool" icon="pi pi-plus" @click="openCreateModal" />
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading tools...</p>
      </div>

      <div v-else-if="toolsList.length === 0" class="empty-state">
        <p>No tools yet. Create a custom tool to extend the AI's capabilities!</p>
      </div>

      <div v-else class="tools-grid">
        <div v-for="tool in toolsList" :key="tool._id" class="tool-card">
          <div class="tool-header">
            <h3>{{ tool.name }}</h3>
            <span :class="['status-badge', tool.is_active ? 'active' : 'inactive']">
              {{ tool.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <p class="tool-description">{{ tool.description }}</p>
          <div v-if="tool.parameters && tool.parameters.length > 0" class="tool-parameters">
            <span class="param-label">Parameters:</span>
            <span v-for="param in tool.parameters" :key="param.name" class="param">
              {{ param.name }}:{{ param.type }}
            </span>
          </div>
          <div class="tool-actions">
            <Button text label="Execute" @click="executeTool(tool)" />
            <Button text label="Edit" @click="editTool(tool)" />
            <Button text severity="danger" label="Delete" @click="deleteTool(tool._id)" />
          </div>
        </div>
      </div>

      <Dialog v-model:visible="dialogVisible" :modal="true" header="Tool Configuration" :style="{ width: '700px' }">
        <div class="tool-form">
          <div class="form-group">
            <label>Name</label>
            <InputText v-model="form.name" placeholder="Tool name" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <InputText v-model="form.description" placeholder="What does this tool do?" />
          </div>
          <div class="form-group">
            <label>Code</label>
            <textarea v-model="form.code" rows="10" placeholder="function myTool(params) {\n  return result;\n}" />
          </div>
          <div class="form-group">
            <label>Parameters (JSON)</label>
            <textarea v-model="form.parametersJson" rows="4" placeholder='[{"name": "input", "type": "string", "required": true}]' />
          </div>
          <div class="form-group">
            <Checkbox v-model="form.is_active" :binary="true" label="Active" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancel" text @click="closeModal" />
          <Button label="Save" @click="saveTool" />
        </template>
      </Dialog>

      <Dialog v-model:visible="executeDialogVisible" :modal="true" header="Execute Tool" :style="{ width: '600px' }">
        <div v-if="selectedTool" class="execute-form">
          <div v-for="param in selectedTool.parameters" :key="param.name" class="form-group">
            <label>{{ param.name }} {{ param.required ? '*' : '' }}</label>
            <InputText v-model="execParams[param.name]" :placeholder="'Value for ' + param.name" />
          </div>
        </div>
        <div v-if="executeResult" class="execute-result">
          <h4>Result:</h4>
          <pre>{{ JSON.stringify(executeResult, null, 2) }}</pre>
        </div>
        <template #footer>
          <Button label="Execute" @click="runTool" :disabled="!selectedTool" />
        </template>
      </Dialog>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToolStore } from '@/stores/tool'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'

const toolStore = useToolStore()
const loading = ref(false)
const dialogVisible = ref(false)
const executeDialogVisible = ref(false)
const editingTool = ref(null)
const selectedTool = ref(null)
const executeResult = ref(null)

const toolsList = computed(() => toolStore.tools)

const form = ref({
  name: '',
  description: '',
  code: '',
  parametersJson: '[]',
  is_active: true
})

const execParams = ref({})

const openCreateModal = () => {
  editingTool.value = null
  form.value = {
    name: '',
    description: '',
    code: '',
    parametersJson: '[]',
    is_active: true
  }
  dialogVisible.value = true
}

const editTool = (tool) => {
  editingTool.value = tool
  form.value = {
    name: tool.name,
    description: tool.description,
    code: tool.code,
    parametersJson: JSON.stringify(tool.parameters || [], null, 2),
    is_active: tool.is_active
  }
  dialogVisible.value = true
}

const closeModal = () => {
  dialogVisible.value = false
}

const saveTool = async () => {
  if (!form.value.name || !form.value.code) {
    alert('Name and code are required')
    return
  }

  let parameters = []
  try {
    parameters = JSON.parse(form.value.parametersJson || '[]')
  } catch (e) {
    alert('Invalid JSON for parameters')
    return
  }

  const toolData = {
    name: form.value.name,
    description: form.value.description,
    code: form.value.code,
    parameters,
    is_active: form.value.is_active
  }

  try {
    if (editingTool.value) {
      await toolStore.updateTool(editingTool.value._id, toolData)
    } else {
      await toolStore.createTool(toolData)
    }
    closeModal()
  } catch (error) {
    console.error('Failed to save tool:', error)
    alert('Failed to save tool: ' + (error.response?.data?.message || error.message))
  }
}

const deleteTool = async (toolId) => {
  if (!confirm('Are you sure you want to delete this tool?')) return

  try {
    await toolStore.deleteTool(toolId)
  } catch (error) {
    console.error('Failed to delete tool:', error)
    alert('Failed to delete tool')
  }
}

const executeTool = (tool) => {
  selectedTool.value = tool
  execParams.value = {}
  executeResult.value = null
  executeDialogVisible.value = true
}

const runTool = async () => {
  if (!selectedTool.value) return

  try {
    executeResult.value = await toolStore.executeTool(selectedTool.value._id, execParams.value)
  } catch (error) {
    console.error('Tool execution failed:', error)
    alert('Execution failed: ' + (error.response?.data?.message || error.message))
  }
}

const loadTools = async () => {
  loading.value = true
  try {
    await toolStore.listTools()
  } catch (error) {
    console.error('Failed to load tools:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTools()
})
</script>

<style scoped>
.tools-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.tools-main {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.tools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.tools-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.25rem;
}

.tool-card {
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.tool-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.tool-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.tool-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.tool-parameters {
  margin-bottom: 1rem;
}

.param-label {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 600;
}

.param {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #e0e7ff;
  color: #4338ca;
  margin: 0.25rem 0.25rem 0 0;
}

.tool-actions {
  display: flex;
  gap: 0.5rem;
}

.tool-form,
.execute-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: monospace;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: #2d6a4f;
}

.execute-result {
  margin-top: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 6px;
}

.execute-result h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.execute-result pre {
  margin: 0;
  overflow-x: auto;
  font-size: 0.875rem;
}
</style>