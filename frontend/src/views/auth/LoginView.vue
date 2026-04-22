<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">LLM Server</h1>
      <p class="auth-subtitle">Chat with Llama.cpp and manage your AI workspace</p>
      <LoginKeypad />
    </div>
  </div>
</template>

<script setup>
import LoginKeypad from '@/components/auth/LoginKeypad.vue'
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
}

.auth-title {
  font-size: 2rem;
  color: #2d6a4f;
  text-align: center;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  text-align: center;
  color: #6b7280;
  margin-bottom: 2rem;
}
</style>
