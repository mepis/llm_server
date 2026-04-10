import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useLogStore = defineStore('log', {
  state: () => ({
    logs: [],
    stats: {},
    loading: false,
    error: null
  }),

  actions: {
    async listLogs(options = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/logs', { params: options })
        this.logs = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list logs'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getStats() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/logs/stats')
        this.stats = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get log stats'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
