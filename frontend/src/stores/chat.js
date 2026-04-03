import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = 'http://localhost:8080/api'

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [],
    currentSession: null,
    messages: [],
    loading: false,
    error: null
  }),

  actions: {
    async createSession(name = 'New Chat') {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post(`${API_URL}/chat/sessions`, { name })
        this.sessions.unshift(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create session'
        throw error
      } finally {
        this.loading = false
      }
    },

    async listSessions() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/chat/sessions`)
        this.sessions = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list sessions'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getMessages(sessionId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/chat/sessions/${sessionId}/messages`)
        this.currentSession = sessionId
        this.messages = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get messages'
        throw error
      } finally {
        this.loading = false
      }
    },

    async sendMessage(sessionId, content) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post(`${API_URL}/chat/sessions/${sessionId}/messages`, { content })
        this.messages.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send message'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteSession(sessionId) {
      this.loading = true
      this.error = null
      try {
        await axios.delete(`${API_URL}/chat/sessions/${sessionId}`)
        this.sessions = this.sessions.filter(s => s._id !== sessionId)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete session'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
