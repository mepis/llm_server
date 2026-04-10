import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useToolStore = defineStore('tool', {
  state: () => ({
    tools: [],
    currentTool: null,
    loading: false,
    error: null
  }),

  actions: {
    async createTool(data) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/tools', data)
        this.tools.unshift(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create tool'
        throw error
      } finally {
        this.loading = false
      }
    },

    async listTools() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/tools')
        this.tools = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list tools'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getToolById(toolId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get(`/tools/${toolId}`)
        this.currentTool = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get tool'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateTool(toolId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.put(`/tools/${toolId}`, data)
        const index = this.tools.findIndex(t => t._id === toolId)
        if (index !== -1) {
          this.tools[index] = response.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update tool'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteTool(toolId) {
      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/tools/${toolId}`)
        this.tools = this.tools.filter(t => t._id !== toolId)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete tool'
        throw error
      } finally {
        this.loading = false
      }
    },

    async executeTool(toolId, params) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post(`/tools/${toolId}/execute`, params)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to execute tool'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
