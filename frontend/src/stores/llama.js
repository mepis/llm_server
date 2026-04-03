import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

export const useLlamaStore = defineStore('llama', {
  state: () => ({
    models: [],
    currentModel: null,
    status: null,
    loading: false,
    error: null
  }),

  actions: {
    async listModels() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/llama/models`)
        this.models = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list models'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getModelInfo(modelId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/llama/models/${modelId}`)
        this.currentModel = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get model info'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getServerStatus() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/llama/status`)
        this.status = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get server status'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
