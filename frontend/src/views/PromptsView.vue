<template>
  <div class="prompts-container">
    <Header />
    <Sidebar />
    <main class="prompts-main">
      <div class="prompts-header">
        <h1>Prompt Library</h1>
        <Button label="New Prompt" icon="pi pi-plus" @click="openCreateModal" />
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading prompts...</p>
      </div>

      <div v-else-if="promptsList.length === 0" class="empty-state">
        <p>No prompts yet. Create your first prompt template!</p>
      </div>

      <div v-else class="prompts-grid">
        <div v-for="prompt in promptsList" :key="prompt._id" class="prompt-card">
          <div class="prompt-header">
            <h3>{{ prompt.name }}</h3>
            <span class="type-badge">{{ prompt.type }}</span>
          </div>
          <p class="prompt-preview">{{ truncate(prompt.content, 100) }}</p>
          <div class="prompt-tags">
            <span v-for="tag in prompt.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="prompt-actions">
            <Button text label="Edit" @click="editPrompt(prompt)" />
            <Button text severity="danger" label="Delete" @click="deletePrompt(prompt._id)" />
          </div>
        </div>
      </div>

      <Dialog v-model:visible="dialogVisible" :modal="true" header="Prompt Template" :style="{ width: '600px' }">
        <div class="prompt-form">
          <div class="form-group">
            <label>Name</label>
            <InputText v-model="form.name" placeholder="Prompt name" />
          </div>
          <div class="form-group">
            <label>Type</label>
            <InputText v-model="form.type" placeholder="e.g., code-review, creative-writing" />
          </div>
          <div class="form-group">
            <label>Content</label>
            <textarea v-model="form.content" rows="8" placeholder="Enter your prompt template..." />
          </div>
          <div class="form-group">
            <label>Tags (comma-separated)</label>
            <InputText v-model="form.tagsInput" placeholder="tag1, tag2, tag3" />
          </div>
          <div class="form-group">
            <Checkbox v-model="form.is_public" :binary="true" label="Make public" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancel" text @click="closeModal" />
          <Button label="Save" @click="savePrompt" />
        </template>
      </Dialog>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePromptStore } from '@/stores/prompt'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'

const promptStore = usePromptStore()
const loading = ref(false)
const dialogVisible = ref(false)
const editingPrompt = ref(null)

const promptsList = computed(() => promptStore.prompts)

const form = ref({
  name: '',
  type: '',
  content: '',
  tagsInput: '',
  is_public: false
})

const truncate = (text, length) => {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

const openCreateModal = () => {
  editingPrompt.value = null
  form.value = {
    name: '',
    type: '',
    content: '',
    tagsInput: '',
    is_public: false
  }
  dialogVisible.value = true
}

const editPrompt = (prompt) => {
  editingPrompt.value = prompt
  form.value = {
    name: prompt.name,
    type: prompt.type,
    content: prompt.content,
    tagsInput: prompt.tags?.join(', ') || '',
    is_public: prompt.is_public
  }
  dialogVisible.value = true
}

const closeModal = () => {
  dialogVisible.value = false
}

const savePrompt = async () => {
  if (!form.value.name || !form.value.content) {
    alert('Name and content are required')
    return
  }

  const tags = form.value.tagsInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t)

  const promptData = {
    name: form.value.name,
    type: form.value.type,
    content: form.value.content,
    tags,
    is_public: form.value.is_public
  }

  try {
    if (editingPrompt.value) {
      await promptStore.updatePrompt(editingPrompt.value._id, promptData)
    } else {
      await promptStore.createPrompt(promptData)
    }
    closeModal()
  } catch (error) {
    console.error('Failed to save prompt:', error)
    alert('Failed to save prompt: ' + (error.response?.data?.message || error.message))
  }
}

const deletePrompt = async (promptId) => {
  if (!confirm('Are you sure you want to delete this prompt?')) return

  try {
    await promptStore.deletePrompt(promptId)
  } catch (error) {
    console.error('Failed to delete prompt:', error)
    alert('Failed to delete prompt')
  }
}

const loadPrompts = async () => {
  loading.value = true
  try {
    await promptStore.listPrompts()
  } catch (error) {
    console.error('Failed to load prompts:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPrompts()
})
</script>

<style scoped>
.prompts-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.prompts-main {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.prompts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.prompts-header h1 {
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

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.25rem;
}

.prompt-card {
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.prompt-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.prompt-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 600;
}

.prompt-preview {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.prompt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: #f3f4f6;
  color: #6b7280;
}

.prompt-actions {
  display: flex;
  gap: 0.5rem;
}

.prompt-form {
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
  font-family: inherit;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: #2d6a4f;
}
</style>