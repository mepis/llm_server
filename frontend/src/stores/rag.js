import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useRAGStore = defineStore('rag', {
  state: () => ({
    documents: [],
    currentDocument: null,
    queries: [],
    loading: false,
    error: null
  }),

  actions: {
    async uploadDocument(file, metadata = {}) {
      this.loading = true
      this.error = null
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('metadata', JSON.stringify(metadata))

        const response = await apiClient.post('/rag/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        this.documents.unshift(response.data.data)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to upload document'
        throw error
      } finally {
        this.loading = false
      }
    },

    async listDocuments() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/rag/documents')
        this.documents = response.data.data || []
        return this.documents
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list documents'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteDocument(documentId) {
      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/rag/documents/${documentId}`)
        this.documents = this.documents.filter(d => d._id !== documentId)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete document'
        throw error
      } finally {
        this.loading = false
      }
    },

    async queryKnowledgeBase(query, documentIds = []) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/rag/query', { query, documentIds })
        this.queries.unshift(response.data.data)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to query knowledge base'
        throw error
      } finally {
        this.loading = false
      }
    },

    async searchDocuments(query, topK = 5, minScore = 0.7) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/rag/search', {
          query,
          top_k: topK,
          min_score: minScore
        })
        return response.data || []
      } catch (error) {
        this.error = error.response?.data?.message || 'Search failed'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
