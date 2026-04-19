import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useLogStore = defineStore('log', {
  state: () => ({
    logs: [],
    pagination: {},
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
        const data = response.data.data || {}
        this.logs = data.logs || []
        this.pagination = {
          total: data.total,
          page: data.page,
          limit: data.limit,
          totalPages: data.totalPages
        }
        return this.logs
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
        this.stats = response.data.data || {}
        return this.stats
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get log stats'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
