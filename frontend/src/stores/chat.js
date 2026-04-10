import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [],
    currentChat: null,
    loading: false,
    error: null
  }),

  actions: {
    async createSession(name = 'New Chat') {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post(`${API_URL}/chats`, { session_name: name })
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
        const response = await axios.get(`${API_URL}/chats`)
        this.sessions = response.data || []
        return this.sessions
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list sessions'
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadChat(chatId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/chats/${chatId}`)
        this.currentChat = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load chat'
        throw error
      } finally {
        this.loading = false
      }
    },

    async addMessage(content) {
      this.loading = true
      this.error = null
      try {
        if (!this.currentChat) {
          const newChat = await this.createSession()
          this.currentChat = newChat
        }
        
        const response = await axios.post(`${API_URL}/chats/${this.currentChat.chat_id}/llm`, { message: content })
        
        const userMessage = {
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        }
        
        const assistantMessage = {
          role: 'assistant',
          content: response.data.data,
          timestamp: new Date().toISOString()
        }
        
        if (!this.currentChat.messages) {
          this.currentChat.messages = []
        }
        
        this.currentChat.messages.push(userMessage, assistantMessage)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send message'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteChat(chatId) {
      this.loading = true
      this.error = null
      try {
        await axios.delete(`${API_URL}/chats/${chatId}`)
        this.sessions = this.sessions.filter(s => s.chat_id !== chatId)
        if (this.currentChat?.chat_id === chatId) {
          this.currentChat = null
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete chat'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
