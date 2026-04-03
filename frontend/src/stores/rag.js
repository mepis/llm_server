import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

export const useRagStore = defineStore('rag', {
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

        const response = await axios.post(`${API_URL}/rag/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        this.documents.unshift(response.data)
        return response.data
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
        const response = await axios.get(`${API_URL}/rag/documents`)
        this.documents = response.data
        return response.data
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
        await axios.delete(`${API_URL}/rag/documents/${documentId}`)
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
        const response = await axios.post(`${API_URL}/rag/query`, { query, documentIds })
        this.queries.unshift(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to query knowledge base'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
