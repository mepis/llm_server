<template>
  <div class="auth-container">
    <LoginKeypad />
  </div>
</template>

<script setup>
import LoginKeypad from '@/components/auth/LoginKeypad.vue'
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 1rem;
}

@media (max-width: 480px) {
  .auth-container {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 15vh;
  }
}
</style>
