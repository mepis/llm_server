import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null
  }),

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/auth/login', credentials)
        const data = response.data.data
        this.token = data.token
        this.user = data.user
        this.isAuthenticated = true
        localStorage.setItem('token', data.token)
        return response.data
      } catch (error) {
        if (error.response) {
          this.error = error.response.data?.error || error.response.data?.message || 'Login failed'
        } else if (error.request) {
          this.error = 'Network error. Please check your connection and try again.'
        } else {
          this.error = 'Login failed. Please try again.'
        }
        error.message = this.error
        throw error
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/auth/register', userData)
        return response.data
      } catch (error) {
        if (error.response) {
          this.error = error.response.data?.error || error.response.data?.message || 'Registration failed'
        } else if (error.request) {
          this.error = 'Network error. Please check your connection and try again.'
        } else {
          this.error = 'Registration failed. Please try again.'
        }
        error.message = this.error
        throw error
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
    },

    async fetchUser() {
      if (!this.token) return null
      try {
        const response = await apiClient.get('/users/me')
        this.user = response.data.data
        return response.data.data
      } catch (error) {
        this.logout()
        throw error
      }
    }
  }
})
