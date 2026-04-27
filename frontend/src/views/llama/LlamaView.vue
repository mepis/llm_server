<template>
  <div class="llama-container">
    <main class="llama-main">
      <div class="llama-header">
        <h1>LLM Integration</h1>
      </div>

      <div class="llama-content">
        <Card>
          <template #content>
            <div class="llama-section">
              <h2>Llama.cpp Server</h2>
              <p>Configure your Llama.cpp inference server connection.</p>
              <div class="form-field">
                <label>Server URL</label>
                <InputText v-model="serverUrl" placeholder="http://localhost:8080" />
              </div>
              <div class="form-field">
                <label>Model</label>
                <InputText v-model="model" placeholder="llama-3-8b" />
              </div>
              <div class="form-field">
                <label>Embedding Model</label>
                <InputText v-model="embeddingModel" placeholder="all-MiniLM-L6-v2" />
              </div>
              <Button label="Save Settings" @click="saveSettings" />
            </div>
          </template>
        </Card>

        <Card v-if="models.length > 0" class="mt-4">
          <template #header>Available Models</template>
          <template #content>
            <ul class="model-list">
              <li v-for="m in models" :key="m.id || m.model">{{ m.id || m.model }}</li>
            </ul>
          </template>
        </Card>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLlamaStore } from '@/stores/llama'

const llamaStore = useLlamaStore()
const serverUrl = ref('')
const model = ref('')
const embeddingModel = ref('')
const models = ref([])

const loadModels = async () => {
  try {
    models.value = await llamaStore.listModels()
  } catch (e) {
    console.error('Failed to list models:', e)
  }
}

const saveSettings = () => {
  // TODO: Implement settings save via API
  console.log('Saving Llama settings:', { serverUrl: serverUrl.value, model: model.value })
}

onMounted(loadModels)
</script>

<style scoped>
.llama-container {
  min-height: 100vh;
  background: #f9fafb;
}
.llama-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}
.llama-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}
.llama-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.form-field label {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
}
.model-list {
  list-style: none;
  padding: 0;
}
.model-list li {
  padding: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.mt-4 {
  margin-top: 1rem;
}
</style>
