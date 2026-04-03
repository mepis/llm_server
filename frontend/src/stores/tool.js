import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

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
        const response = await axios.post(`${API_URL}/tools`, data)
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
        const response = await axios.get(`${API_URL}/tools`)
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
        const response = await axios.get(`${API_URL}/tools/${toolId}`)
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
        const response = await axios.put(`${API_URL}/tools/${toolId}`, data)
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
        await axios.delete(`${API_URL}/tools/${toolId}`)
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
        const response = await axios.post(`${API_URL}/tools/${toolId}/execute`, params)
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
