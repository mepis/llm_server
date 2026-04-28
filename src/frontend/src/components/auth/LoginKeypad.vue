<template>
  <div class="login-container">
    <Toast position="top-center" />
    <div class="login-card">
      <h1 class="login-title">{{ appTitle }}</h1>
      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username" class="form-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            autocomplete="username"
            class="form-input"
            placeholder="Enter your username"
          />
        </div>
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            autocomplete="current-password"
            class="form-input"
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <p class="login-footer">
        Don't have an account? <router-link to="/register" class="login-link">Register</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const appTitle = import.meta.env.VITE_APP_TITLE || 'LLM Server'
const loading = ref(false)

const form = ref({
  username: '',
  password: ''
})

const getErrorMessage = (error) => {
  if (error.response && error.response.data) {
    return error.response.data.error || 
           error.response.data.message || 
           'Authentication failed'
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred during login'
}

const handleLogin = async () => {
  loading.value = true
  try {
    await authStore.login(form.value)
    router.push('/chat')
  } catch (error) {
    console.error('Login failed:', error)
    toast.add({
      severity: 'error',
      summary: 'Login Failed',
      detail: getErrorMessage(error),
      life: 4000
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  padding: 1rem;
}

.login-card {
  background: transparent;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-title {
  font-size: 2rem;
  color: #2d6a4f;
  text-align: center;
  margin-bottom: 0.5rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #2d6a4f;
}

.btn-primary {
  background: #2d6a4f;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #22543d;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  color: #6b7280;
  margin-top: 1.5rem;
}

.login-link {
  color: #2d6a4f;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .login-card {
    padding: 2rem;
    max-width: 100%;
  }

  .login-title {
    font-size: 1.75rem;
  }

  .login-subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 10vh;
  }

  .login-card {
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .login-title {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .login-subtitle {
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
  }

  .login-form {
    gap: 1rem;
  }

  .form-label {
    font-size: 0.85rem;
  }

  .form-input {
    padding: 0.65rem;
    font-size: 0.95rem;
  }

  .btn-primary {
    padding: 0.65rem;
    font-size: 0.95rem;
  }

  .login-footer {
    margin-top: 1.25rem;
    font-size: 0.9rem;
  }
}
</style>
