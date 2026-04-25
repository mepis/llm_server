import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    autoPlayTTS: localStorage.getItem('autoPlayTTS') === 'true',
    hideToolMessages: localStorage.getItem('hideToolMessages') === 'true',
    debugMode: localStorage.getItem('debugMode') === 'true',
    userPreferences: null,
    displayName: null,
    matrixUsername: null,
    configSettings: [],
    llamaModels: [],
    healthStatus: null,
    loading: false,
    error: null
  }),

  actions: {
    setAutoPlayTTS(value) {
      this.autoPlayTTS = value
      localStorage.setItem('autoPlayTTS', String(value))
    },

    setHideToolMessages(value) {
      this.hideToolMessages = value
      localStorage.setItem('hideToolMessages', String(value))
    },

    setDebugMode(value) {
      this.debugMode = value
      localStorage.setItem('debugMode', String(value))
    },

    async fetchUserPreferences() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/users/me')
        const userData = response.data.data
        this.userPreferences = userData.preferences || {}
        this.displayName = userData.display_name
        this.matrixUsername = userData.matrix_username
        return this.userPreferences
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch user preferences'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateUserPreferences(prefs) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.patch('/users/me', { preferences: prefs })
        this.userPreferences = response.data.data.preferences || {}
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update user preferences'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateAccountInfo(data) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.patch('/users/me', data)
        const userData = response.data.data
        if (data.display_name !== undefined) {
          this.displayName = userData.display_name
        }
        if (data.matrix_username !== undefined) {
          this.matrixUsername = userData.matrix_username
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update account info'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchConfigSettings() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/config')
        this.configSettings = response.data.data || []
        return this.configSettings
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch config settings'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateConfigSetting(key, value) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.patch(`/config/${key}`, { value })
        const updated = response.data.data
        const index = this.configSettings.findIndex(s => s.key === key)
        if (index !== -1) {
          this.configSettings[index] = updated
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update setting'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchLlamaModels() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/llama/models')
        const data = response.data.data || []
        if (data.data && Array.isArray(data.data)) {
          this.llamaModels = data.data.map(m => String(m.id))
        } else if (Array.isArray(data)) {
          this.llamaModels = data.map(m => String(m.id || m.model_id || m.name))
        }
        return this.llamaModels
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch llama models'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchHealthStatus() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/system/health')
        this.healthStatus = response.data.data || {}
        return this.healthStatus
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch health status'
        throw error
      } finally {
        this.loading = false
      }
    },

    getConfigValue(key) {
      const setting = this.configSettings.find(s => s.key === key)
      return setting ? setting.value : null
    }
  }
})
