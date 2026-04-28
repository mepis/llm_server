<template>
  <div class="config-container">
    <main class="config-main">
      <div class="config-header">
        <h1>Configuration</h1>
      </div>

      <div class="config-content">
        <Card v-if="!loading">
          <template #content>
            <div class="config-section">
              <p v-if="configs.length === 0" class="empty-state">No configuration entries found.</p>
              <DataTable v-else :value="configs" stripedRows>
                <Column field="key" header="Key" />
                <Column field="value" header="Value" />
                <Column field="category" header="Category" />
              </DataTable>
            </div>
          </template>
        </Card>
        <div v-else class="loading-state">
          <p>Loading configuration...</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const configs = ref([])
const loading = ref(true)

const loadConfigs = async () => {
  try {
    const response = await fetch('/api/config')
    const result = await response.json()
    configs.value = result.data || []
  } catch (e) {
    console.error('Failed to load configs:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadConfigs)
</script>

<style scoped>
.config-container {
  min-height: 100vh;
  background: #f9fafb;
}
.config-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
.config-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}
.empty-state {
  color: #6b7280;
  text-align: center;
  padding: 2rem;
}
</style>
