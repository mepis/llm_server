<template>
  <div class="settings-container">
    <main class="settings-main">
      <div class="settings-header">
        <h1>Account Settings</h1>
      </div>

      <Tabs :value="activeTab" @update:value="activeTab = $event">
        <TabList>
          <Tab value="account">Account Info</Tab>
          <Tab value="security">Security</Tab>
          <Tab value="appearance">Appearance</Tab>
        </TabList>

        <TabPanel value="account">
          <div class="tab-content">
            <div v-if="settingsStore.loading && !settingsStore.userPreferences" class="loading-state">
              <p>Loading...</p>
            </div>
            <div v-else class="settings-section">
              <h2>Personal Information</h2>

              <div class="form-field">
                <label>Display Name</label>
                <InputText v-model="accountForm.displayName" placeholder="Your display name (optional)" />
              </div>

              <div class="form-field">
                <label>Email</label>
                <InputText v-model="accountForm.email" type="email" placeholder="Your email address" />
              </div>

              <div class="form-field">
                <label>Matrix Username</label>
                <InputText v-model="accountForm.matrixUsername" placeholder="@username:server.domain" />
              </div>

              <div class="divider-section">
                <Divider />
              </div>

              <Button
                label="Save account info"
                :loading="savingAccount"
                @click="saveAccountInfo"
              />
            </div>
          </div>
        </TabPanel>

        <TabPanel value="security">
          <div class="tab-content">
            <div class="settings-section">
              <h2>Change Password</h2>
              <p class="section-desc">Enter your current password and a new password to update your account security.</p>

              <div class="form-field">
                <label>Current Password <span class="required">*</span></label>
                <InputText v-model="passwordForm.currentPassword" type="password" placeholder="Enter current password" />
              </div>

              <div class="form-field">
                <label>New Password <span class="required">*</span></label>
                <InputText v-model="passwordForm.newPassword" type="password" placeholder="Enter new password" />
              </div>

              <div class="form-field">
                <label>Confirm New Password <span class="required">*</span></label>
                <InputText v-model="passwordForm.confirmPassword" type="password" placeholder="Confirm new password" />
              </div>

              <div class="divider-section">
                <Divider />
              </div>

              <Button
                label="Change password"
                severity="warning"
                :loading="changingPassword"
                @click="changePassword"
              />
            </div>
          </div>
        </TabPanel>

        <TabPanel value="appearance">
          <div class="tab-content">
            <div v-if="settingsStore.loading && !settingsStore.userPreferences" class="loading-state">
              <p>Loading preferences...</p>
            </div>
            <div v-else class="settings-section">
              <h2>Default Model</h2>
              <p class="section-desc">Select the default LLM model for your sessions.</p>

              <div class="form-field">
                <label>Model</label>
                <Dropdown
                  v-model="localPrefs.default_model"
                  :options="modelOptions"
                  placeholder="Select a model"
                  :loading="modelsLoading"
                />
                <Button
                  label="Refresh models"
                  text
                  size="small"
                  @click="loadModels"
                  :disabled="modelsLoading"
                />
              </div>

              <div class="form-field">
                <label>Language</label>
                <InputText v-model="localPrefs.language" placeholder="e.g., en, zh" />
              </div>

              <div class="form-field">
                <label>Chat Page Size</label>
                <Dropdown
                  v-model="localPrefs.chat_page_size"
                  :options="pageSizeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select page size"
                />
              </div>

              <Divider />

              <div class="form-field">
                <label>Theme</label>
                <Dropdown
                  v-model="localPrefs.theme"
                  :options="themeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select theme"
                />
              </div>

              <Divider />

              <div class="form-field toggle-field">
                <div class="toggle-info">
                  <label>Auto-play TTS</label>
                  <p>Automatically play text-to-speech output when available.</p>
                </div>
                <ToggleSwitch :model-value="settingsStore.autoPlayTTS" @update:model-value="settingsStore.setAutoPlayTTS" />
              </div>

              <Divider />

              <Button
                label="Save preferences"
                :loading="savingPrefs"
                @click="savePreferences"
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
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Divider from 'primevue/divider'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const toast = useToast()

const activeTab = ref('account')
const savingAccount = ref(false)
const changingPassword = ref(false)
const savingPrefs = ref(false)
const modelsLoading = ref(false)

const accountForm = ref({
  displayName: '',
  email: '',
  matrixUsername: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const localPrefs = ref({
  default_model: '',
  language: 'en',
  chat_page_size: 10,
  theme: 'light'
})

const pageSizeOptions = [
  { label: '10 messages', value: 10 },
  { label: '20 messages', value: 20 },
  { label: '50 messages', value: 50 }
]

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' }
]

const modelOptions = computed(() => {
  return settingsStore.llamaModels
})

const loadModels = async () => {
  modelsLoading.value = true
  try {
    await settingsStore.fetchLlamaModels()
  } catch (error) {
    console.error('Failed to load models:', error)
  } finally {
    modelsLoading.value = false
  }
}

const saveAccountInfo = async () => {
  savingAccount.value = true
  try {
    const data = {}
    if (accountForm.value.displayName !== null && accountForm.value.displayName !== undefined) {
      data.display_name = accountForm.value.displayName || null
    }
    if (accountForm.value.email) {
      data.email = accountForm.value.email
    }
    data.matrix_username = accountForm.value.matrixUsername || null

    await settingsStore.updateAccountInfo(data)
    const emailChanged = accountForm.value.email !== authStore.user?.email
    if (emailChanged) {
      await authStore.fetchUser()
    }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Account information updated', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to update account info', life: 5000 })
  } finally {
    savingAccount.value = false
  }
}

const changePassword = async () => {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Current password and new password are required', life: 3000 })
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'New passwords do not match', life: 3000 })
    return
  }

  changingPassword.value = true
  try {
    await authStore.changePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword)
    toast.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully', life: 3000 })
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to change password', life: 5000 })
  } finally {
    changingPassword.value = false
  }
}

const savePreferences = async () => {
  savingPrefs.value = true
  try {
    await settingsStore.updateUserPreferences(localPrefs.value)
    toast.add({ severity: 'success', summary: 'Success', detail: 'Preferences saved', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save preferences', life: 5000 })
  } finally {
    savingPrefs.value = false
  }
}

onMounted(async () => {
  try {
    await settingsStore.fetchUserPreferences()
    accountForm.value.displayName = settingsStore.displayName || ''
    accountForm.value.email = authStore.user?.email || ''
    accountForm.value.matrixUsername = settingsStore.matrixUsername || ''

    const prefs = settingsStore.userPreferences || {}
    localPrefs.value = {
      default_model: prefs.default_model || '',
      language: prefs.language || 'en',
      chat_page_size: prefs.chat_page_size || 10,
      theme: prefs.theme || 'light'
    }
  } catch (error) {
    console.error('Failed to load preferences:', error)
  }

  try {
    await loadModels()
  } catch (error) {
    console.error('Failed to load models on mount:', error)
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
  max-width: 700px;
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

.required {
  color: #ef4444;
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

.divider-section {
  margin-top: 1rem;
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
