<template>
  <div class="debug-container">
    <main class="debug-main">
      <div class="debug-header">
        <h1>Debug</h1>
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
        </Accordion>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
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
.debug-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}
pre {
  background: #1f2937;
  color: #e5e7eb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
}
</style>
