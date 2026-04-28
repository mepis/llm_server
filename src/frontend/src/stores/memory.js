import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useMemoryStore = defineStore('memory', {
  state: () => ({
    episodic: [],
    semantic: [],
    procedural: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchMemories(layer, limit = 10) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get(`/memory/memories?layer=${layer}&limit=${limit}`)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch memories'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchEpisodic(limit = 10) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get(`/memory/episodic?limit=${limit}`)
        this.episodic = response.data.data || []
        return this.episodic
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch episodic memories'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchSemantic(query = null) {
      this.loading = true
      this.error = null
      try {
        const url = query ? `/memory/semantic?q=${encodeURIComponent(query)}` : '/memory/semantic'
        const response = await apiClient.get(url)
        this.semantic = response.data.data || []
        return this.semantic
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch semantic memories'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchProcedural() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/memory/procedural')
        this.procedural = response.data.data || []
        return this.procedural
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch procedural memories'
        throw error
      } finally {
        this.loading = false
      }
    },

    async extractMemories(sessionId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/memory/extract', { session_id: sessionId })
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to extract memories'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteMemory(id) {
      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/memory/${id}`)
        this.episodic = this.episodic.filter(m => m._id !== id)
        this.semantic = this.semantic.filter(m => m._id !== id)
        this.procedural = this.procedural.filter(m => m._id !== id)
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to delete memory'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
