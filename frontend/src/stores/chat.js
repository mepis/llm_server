import { defineStore } from 'pinia'
import apiClient from '@/axios'

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
        const response = await apiClient.post('/chats', { session_name: name })
        const session = response.data.data
        this.sessions.unshift(session)
        this.currentChat = session
        return session
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
        const response = await apiClient.get('/chats')
        this.sessions = response.data.data || []
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
        const response = await apiClient.get(`/chats/${chatId}`)
        this.currentChat = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load chat'
        throw error
      } finally {
        this.loading = false
      }
    },

    async sendMessage(content) {
      this.loading = true
      this.error = null
      try {
        if (!this.currentChat) {
          const newChat = await this.createSession()
          this.currentChat = newChat
        }

        const userMessage = {
          role: 'user',
          content,
          timestamp: new Date().toISOString()
        }

        if (!this.currentChat.messages) {
          this.currentChat.messages = []
        }

        this.currentChat.messages.push(userMessage)

        const response = await apiClient.post(`/chats/${this.currentChat.chat_id}/llm`, { message: content })

        const data = response.data.data

        if (data?.tool_calls && data.tool_calls.length > 0) {
          const assistantMessage = {
            role: 'assistant',
            content: null,
            tool_calls: data.tool_calls,
            timestamp: new Date().toISOString()
          }
          this.currentChat.messages.push(assistantMessage)

          if (data.tool_results) {
            for (const toolResult of data.tool_results) {
              const toolMessage = {
                role: 'tool',
                tool_call_id: toolResult.tool_call_id,
                content: toolResult.content,
                timestamp: new Date().toISOString()
              }
              this.currentChat.messages.push(toolMessage)
            }
          }

          return response.data
        }

        const assistantMessage = {
          role: 'assistant',
          content: data,
          timestamp: new Date().toISOString()
        }

        this.currentChat.messages.push(assistantMessage)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send message'
        if (this.currentChat && this.currentChat.messages.length > 0) {
          const lastMsg = this.currentChat.messages[this.currentChat.messages.length - 1]
          if (lastMsg.role === 'user') {
            this.currentChat.messages.pop()
          }
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadToolCalls(chatId, messageId) {
      this.loading = true
      this.error = null
      try {
        const params = messageId ? { messageId } : {}
        const response = await apiClient.get(`/chats/${chatId}/tool-calls`, { params })
        return response.data.data || []
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load tool calls'
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadToolCall(chatId, toolCallId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get(`/chats/${chatId}/tool-calls/${toolCallId}`)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load tool call'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteChat(chatId) {
      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/chats/${chatId}`)
        this.sessions = this.sessions.filter(s => s._id.toString() !== chatId)
        if (this.currentChat?._id.toString() === chatId) {
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
