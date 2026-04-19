import { defineStore } from 'pinia'
import apiClient from '@/axios'

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
        const response = await apiClient.get('/llama/models')
        this.models = response.data.data || []
        return this.models
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
        const response = await apiClient.get(`/llama/models/${modelId}`)
        this.currentModel = response.data.data
        return response.data.data
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
        const response = await apiClient.get('/llama/status')
        this.status = response.data.data
        return this.status
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get server status'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
