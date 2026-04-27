<template>
  <div class="matrix-container">
    <main class="matrix-main">
      <div class="matrix-header">
        <h1>Matrix Integration</h1>
      </div>

      <div class="matrix-content">
        <Card>
          <template #content>
            <div class="matrix-section">
              <h2>Matrix Bot Configuration</h2>
              <p>Configure the Matrix bot for messaging integration.</p>
              <div class="form-field">
                <label>Home Server URL</label>
                <InputText v-model="homeServer" placeholder="https://matrix.org" />
              </div>
              <div class="form-field">
                <label>Bot Username</label>
                <InputText v-model="botUsername" placeholder="@merlinbot:matrix.org" />
              </div>
              <div class="form-field">
                <label>Bot Password</label>
                <InputText v-model="botPassword" type="password" placeholder="••••••••" />
              </div>
              <Button label="Save Settings" @click="saveSettings" />
            </div>
          </template>
        </Card>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const homeServer = ref('')
const botUsername = ref('')
const botPassword = ref('')

const saveSettings = () => {
  // TODO: Implement settings save
  console.log('Saving Matrix settings:', { homeServer: homeServer.value, botUsername: botUsername.value })
}
</script>

<style scoped>
.matrix-container {
  min-height: 100vh;
  background: #f9fafb;
}
.matrix-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}
.matrix-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}
.matrix-section {
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
</style>
