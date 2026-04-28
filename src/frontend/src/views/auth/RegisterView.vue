<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Create Account</h1>
      <p class="auth-subtitle">Join the LLM Server platform</p>
      <form class="auth-form" @submit.prevent="handleRegister">
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
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="form-input"
            placeholder="Enter your email"
          />
        </div>
        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            autocomplete="new-password"
            class="form-input"
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
      <p class="auth-footer">
        Already have an account? <router-link to="/login" class="auth-link">Login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')

const form = ref({
  username: '',
  email: '',
  password: ''
})

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.register(form.value)
    router.push('/login')
  } catch (error) {
    console.error('Registration failed:', error)
    errorMessage.value = error.response?.data?.error || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
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

.auth-card {
  background: transparent;
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

.auth-form {
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

.auth-footer {
  text-align: center;
  color: #6b7280;
  margin-top: 1.5rem;
}

.auth-link {
  color: #2d6a4f;
  text-decoration: none;
}

.auth-link:hover {
  text-decoration: underline;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .auth-card {
    padding: 2rem;
    max-width: 100%;
  }

  .auth-title {
    font-size: 1.75rem;
  }

  .auth-subtitle {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .auth-container {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 10vh;
  }

  .auth-card {
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .auth-title {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .auth-subtitle {
    font-size: 0.85rem;
    margin-bottom: 1.25rem;
  }

  .auth-form {
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

  .auth-footer {
    margin-top: 1.25rem;
    font-size: 0.9rem;
  }
}
</style>
