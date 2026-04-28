import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const usePromptStore = defineStore('prompt', {
  state: () => ({
    prompts: [],
    currentPrompt: null,
    loading: false,
    error: null
  }),

  actions: {
    async createPrompt(data) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/prompts', data)
        this.prompts.unshift(response.data.data)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create prompt'
        throw error
      } finally {
        this.loading = false
      }
    },

    async listPrompts() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/prompts')
        this.prompts = response.data.data || []
        return this.prompts
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list prompts'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getPromptById(promptId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get(`/prompts/${promptId}`)
        this.currentPrompt = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get prompt'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePrompt(promptId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.put(`/prompts/${promptId}`, data)
        const updated = response.data.data
        const index = this.prompts.findIndex(p => p._id === promptId)
        if (index !== -1) {
          this.prompts[index] = updated
        }
        return updated
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update prompt'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deletePrompt(promptId) {
      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/prompts/${promptId}`)
        this.prompts = this.prompts.filter(p => p._id !== promptId)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete prompt'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
