import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:3000/api'

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
        const response = await axios.post(`${API_URL}/prompts`, data)
        this.prompts.unshift(response.data)
        return response.data
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
        const response = await axios.get(`${API_URL}/prompts`)
        this.prompts = response.data
        return response.data
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
        const response = await axios.get(`${API_URL}/prompts/${promptId}`)
        this.currentPrompt = response.data
        return response.data
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
        const response = await axios.put(`${API_URL}/prompts/${promptId}`, data)
        const index = this.prompts.findIndex(p => p._id === promptId)
        if (index !== -1) {
          this.prompts[index] = response.data
        }
        return response.data
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
        await axios.delete(`${API_URL}/prompts/${promptId}`)
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
