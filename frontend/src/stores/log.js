import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

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
        const response = await axios.get(`${API_URL}/logs`, { params: options })
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
        const response = await axios.get(`${API_URL}/logs/stats`)
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
