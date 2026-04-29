<template>
  <div class="settings-container">
    <main class="settings-main">
      <div class="settings-header">
        <h1>Settings</h1>
      </div>

      <Tabs :value="activeTab" @update:value="activeTab = $event">
        <TabList>
          <Tab value="user">User Preferences</Tab>
          <Tab v-if="isAdmin" value="system">System Settings</Tab>
          <Tab v-if="isAdmin" value="health">Integrations</Tab>
        </TabList>

        <TabPanel value="user">
          <div class="tab-content">
            <div class="settings-section">
              <h2>User Preferences</h2>
              <p class="section-desc">Personal settings like display name, email, password, and appearance preferences are managed on your Account page.</p>

              <Button label="Go to Account Settings" icon="pi pi-user" @click="$router.push('/account')" />
            </div>
          </div>
        </TabPanel>

        <TabPanel v-if="isAdmin" value="system">
          <div class="tab-content">
            <div v-if="configLoading" class="loading-state">
              <p>Loading system settings...</p>
            </div>
            <div v-else-if="configError || configSettings.length === 0" class="settings-section">
              <div class="error-banner">
                <p v-if="configError" class="error-message">{{ configError }}</p>
                <p v-else class="empty-message">No system settings found in the database.</p>
                <p class="reset-hint">Run the config seed script to initialize settings from environment variables.</p>
                <div class="reset-actions">
                  <Button
                    label="Reset to Defaults"
                    icon="pi pi-refresh"
                    :loading="resetting"
                    @click="resetConfig"
                  />
                  <Button
                    label="Retry"
                    icon="pi pi-sync"
                    text
                    :loading="configLoading"
                    @click="loadConfigSettings"
                  />
                </div>
              </div>
            </div>
            <div v-else class="settings-section">
              <div v-for="category in categories" :key="category" class="category-group">
                <h3>{{ categoryLabels[category] }}</h3>

                <div
                  v-for="setting in getSettingsByCategory(category)"
                  :key="setting.key"
                  class="form-field"
                >
                  <label>{{ setting.key }}</label>

                  <template v-if="isSensitive(setting.key)">
                    <div class="sensitive-field">
                      <InputText
                        :type="revealedKeys.includes(setting.key) ? 'text' : 'password'"
                        v-model="editableSettings[setting.key]"
                      />
                      <Button
                        :icon="revealedKeys.includes(setting.key) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                        text
                        size="small"
                        @click="toggleReveal(setting.key)"
                      />
                    </div>
                  </template>

                  <template v-else>
                    <InputText v-model="editableSettings[setting.key]" />
                  </template>

                  <Button
                    label="Save"
                    size="small"
                    text
                    :loading="savingKeys.includes(setting.key)"
                    @click="saveSetting(setting.key)"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel v-if="isAdmin" value="health">
          <div class="tab-content">
            <div v-if="healthLoading" class="loading-state">
              <p>Checking integration status...</p>
            </div>
            <div v-else class="health-grid">
              <div v-for="(status, name) in healthData" :key="name" class="health-card">
                <div class="health-card-header">
                  <h3>{{ integrationLabels[name] }}</h3>
                  <span :class="['status-badge', getHealthClass(status)]">{{ statusLabel(status) }}</span>
                </div>

                <div v-if="status === 'unconfigured'" class="health-detail">
                  <p>This integration is not configured.</p>
                </div>

                <div v-else-if="status === 'healthy'" class="health-detail">
                  <p class="health-ok">Connected and responding normally.</p>
                  <span v-if="status.latency" class="latency">{{ status.latency }}ms</span>
                </div>

                <div v-else-if="status === 'unreachable'" class="health-detail">
                  <p class="health-error">Service is unreachable.</p>
                  <p v-if="status.error" class="health-error-detail">{{ status.error }}</p>
                </div>
              </div>

              <Button
                label="Refresh status"
                :loading="healthLoading"
                @click="loadHealth"
              />
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'

import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const toast = useToast()

const activeTab = ref('user')

const isAdmin = computed(() => {
  return authStore.user?.roles?.includes('admin') || false
})

const categories = ['server', 'database', 'auth', 'llama', 'tts', 'matrix', 'session', 'logging']
const categoryLabels = {
  server: 'Server',
  database: 'Database',
  auth: 'Authentication',
  llama: 'Llama.cpp',
  tts: 'Text-to-Speech',
  matrix: 'Matrix',
  session: 'Session & Uploads',
  logging: 'Logging'
}

const integrationLabels = {
  llama: 'Llama.cpp',
  tts: 'Text-to-Speech',
  matrix: 'Matrix'
}

const sensitiveKeys = ['MARIADB_PASSWORD', 'JWT_SECRET', 'MATRIX_ACCESS_TOKEN', 'QDRANT_API_KEY']
const revealedKeys = ref([])
const savingKeys = ref([])
const configError = ref(null)
const resetting = ref(false)

const configLoading = computed(() => settingsStore.loading && settingsStore.configSettings.length === 0)

const configSettings = computed(() => settingsStore.configSettings)

const editableSettings = ref({})

const healthLoading = ref(false)
const healthData = ref({ llama: null, tts: null, matrix: null })

const getSettingsByCategory = (category) => {
  return configSettings.value.filter(s => s.category === category)
}

const isSensitive = (key) => sensitiveKeys.includes(key)

const toggleReveal = (key) => {
  const idx = revealedKeys.value.indexOf(key)
  if (idx === -1) {
    revealedKeys.value.push(key)
  } else {
    revealedKeys.value.splice(idx, 1)
  }
}

const getHealthClass = (status) => {
  if (status === 'healthy') return 'status-healthy'
  if (status === 'unconfigured') return 'status-unconfigured'
  return 'status-error'
}

const statusLabel = (status) => {
  if (status === 'healthy') return 'Healthy'
  if (status === 'unconfigured') return 'Not configured'
  return 'Unreachable'
}

const loadConfigSettings = async () => {
  try {
    configError.value = null
    await settingsStore.fetchConfigSettings()
    editableSettings.value = {}
    configSettings.value.forEach(s => {
      editableSettings.value[s.key] = s.value
    })
  } catch (error) {
    console.error('Failed to load config:', error)
    configError.value = error.response?.data?.error || error.message || 'Failed to load system settings'
  }
}

const saveSetting = async (key) => {
  savingKeys.value.push(key)
  try {
    await settingsStore.updateConfigSetting(key, editableSettings.value[key])
    toast.add({ severity: 'success', summary: 'Success', detail: `${key} updated`, life: 3000 })
  } catch (error) {
    console.error('Failed to save setting:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to update ${key}`, life: 5000 })
  } finally {
    savingKeys.value = savingKeys.value.filter(k => k !== key)
  }
}

const resetConfig = async () => {
  resetting.value = true
  configError.value = null
  try {
    await settingsStore.resetConfigSettings()
    editableSettings.value = {}
    configSettings.value.forEach(s => {
      editableSettings.value[s.key] = s.value
    })
    toast.add({ severity: 'success', summary: 'Success', detail: 'Settings reset to defaults', life: 3000 })
  } catch (error) {
    console.error('Failed to reset config:', error)
    configError.value = error.response?.data?.error || error.message || 'Failed to reset settings'
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to reset settings', life: 5000 })
  } finally {
    resetting.value = false
  }
}

const loadHealth = async () => {
  healthLoading.value = true
  try {
    const data = await settingsStore.fetchHealthStatus()
    healthData.value = data || {}
  } catch (error) {
    console.error('Failed to load health:', error)
  } finally {
    healthLoading.value = false
  }
}

onMounted(async () => {
  if (isAdmin.value) {
    try {
      await loadConfigSettings()
    } catch (error) {
      console.error('Failed to load config on mount:', error)
    }

    try {
      await loadHealth()
    } catch (error) {
      console.error('Failed to load health on mount:', error)
    }
  }
})
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.settings-main {
  flex: 1;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.settings-header {
  margin-bottom: 2rem;
}

.settings-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.tab-content {
  max-width: 800px;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

.settings-section h2 {
  font-size: 1.25rem;
  color: #1f2937;
  margin: 0;
}

.section-desc {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-field .pi {
  color: #6b7280;
}

.toggle-field {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.toggle-info p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.category-group {
  margin-bottom: 1.5rem;
}

.category-group h3 {
  font-size: 1rem;
  color: #2d6a4f;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.health-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.health-card {
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.health-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.health-card-header h3 {
  font-size: 1rem;
  color: #1f2937;
  margin: 0;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.status-healthy {
  background: #d1fae5;
  color: #065f46;
}

.status-unconfigured {
  background: #f3f4f6;
  color: #6b7280;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.health-detail {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.health-ok {
  color: #065f46;
  font-size: 0.875rem;
  margin: 0;
}

.health-error {
  color: #991b1b;
  font-size: 0.875rem;
  margin: 0;
}

.health-error-detail {
  color: #6b7280;
  font-size: 0.75rem;
  margin: 0;
  font-style: italic;
}

.latency {
  font-size: 0.75rem;
  color: #6b7280;
}

.sensitive-field {
  display: flex;
  gap: 0.5rem;
}

.sensitive-field .p-inputtext {
  flex: 1;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.error-message {
  color: #991b1b;
  font-size: 0.875rem;
  margin: 0;
  font-weight: 500;
}

.empty-message {
  color: #374151;
  font-size: 0.875rem;
  margin: 0;
}

.reset-hint {
  color: #6b7280;
  font-size: 0.8125rem;
  margin: 0;
}

.reset-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .settings-main {
    padding: 1rem;
  }

  .toggle-field {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
