<template>
  <div class="debug-container">
    <main class="debug-main">
      <div class="debug-header">
        <h1>Debug</h1>
        <Button
          label="Clear All"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="debugStore.clearAll()"
          :disabled="debugStore.errors.length === 0 && debugStore.warnings.length === 0"
        />
      </div>

      <div class="debug-content">
        <Accordion>
          <AccordionPanel value="auth">
            <AccordionHeader>Authentication State</AccordionHeader>
            <AccordionContent>
              <pre>{{ authState }}</pre>
            </AccordionContent>
          </AccordionPanel>
          <AccordionPanel value="api">
            <AccordionHeader>API Health</AccordionHeader>
            <AccordionContent>
              <div v-if="apiHealth">
                <p>Status: {{ apiHealth.status }}</p>
                <p>Timestamp: {{ apiHealth.timestamp }}</p>
              </div>
              <Button v-else label="Check API Health" @click="checkHealth" />
            </AccordionContent>
          </AccordionPanel>
          <AccordionPanel value="errors">
            <AccordionHeader>Errors ({{ debugStore.errors.length }})</AccordionHeader>
            <AccordionContent>
              <div v-if="debugStore.errors.length === 0" class="empty-state">
                No errors logged.
              </div>
              <div v-else class="error-list">
                <div v-for="error in debugStore.errors" :key="error.id" class="error-item">
                  <div class="error-header">
                    <span class="error-message">{{ error.message }}</span>
                    <span class="error-time">{{ formatTime(error.timestamp) }}</span>
                  </div>
                  <div v-if="error.stack" class="error-stack">
                    <pre>{{ error.stack }}</pre>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionPanel>
          <AccordionPanel value="warnings">
            <AccordionHeader>Warnings ({{ debugStore.warnings.length }})</AccordionHeader>
            <AccordionContent>
              <div v-if="debugStore.warnings.length === 0" class="empty-state">
                No warnings logged.
              </div>
              <div v-else class="warning-list">
                <div v-for="warning in debugStore.warnings" :key="warning.id" class="warning-item">
                  <div class="warning-header">
                    <span class="warning-message">{{ warning.message }}</span>
                    <span class="warning-time">{{ formatTime(warning.timestamp) }}</span>
                  </div>
                  <div v-if="warning.stack" class="warning-stack">
                    <pre>{{ warning.stack }}</pre>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import { useAuthStore } from '@/stores/auth'
import { useDebugStore } from '@/stores/debug'

const authStore = useAuthStore()
const debugStore = useDebugStore()
const apiHealth = ref(null)

const authState = computed(() => ({
  isAuthenticated: authStore.isAuthenticated,
  user: authStore.user,
  token: authStore.token ? `${authStore.token.substring(0, 20)}...` : null
}))

const checkHealth = async () => {
  try {
    const response = await fetch('/api/health')
    apiHealth.value = await response.json()
  } catch (e) {
    console.error('Health check failed:', e)
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}
</script>

<style scoped>
.debug-container {
  min-height: 100vh;
  background: #f9fafb;
}
.debug-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}
.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}
.debug-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
pre {
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
  margin: 0;
}
.empty-state {
  color: #6b7280;
  font-style: italic;
  padding: 1rem 0;
}
.error-list,
.warning-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.error-item {
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  background: #fef2f2;
  overflow: hidden;
}
.error-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  gap: 1rem;
}
.error-message {
  font-weight: 600;
  color: #991b1b;
  flex: 1;
}
.error-time {
  font-size: 0.75rem;
  color: #b91c1c;
  white-space: nowrap;
}
.error-stack {
  padding: 0 1rem 1rem;
}
.warning-item {
  border: 1px solid #fde68a;
  border-radius: 0.5rem;
  background: #fffbeb;
  overflow: hidden;
}
.warning-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  gap: 1rem;
}
.warning-message {
  font-weight: 600;
  color: #92400e;
  flex: 1;
}
.warning-time {
  font-size: 0.75rem;
  color: #b45309;
  white-space: nowrap;
}
.warning-stack {
  padding: 0 1rem 1rem;
}
</style>
