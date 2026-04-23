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
        if (session?.messages) {
          for (const msg of session.messages) {
            if (!msg.id) {
              msg.id = msg._id || crypto.randomUUID()
            }
          }
        }
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
        if (this.currentChat?.messages) {
          for (const msg of this.currentChat.messages) {
            if (!msg.id) {
              msg.id = msg._id || crypto.randomUUID()
            }
          }
        }
        return this.currentChat
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
          id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
            role: 'assistant',
            content: null,
            tool_calls: data.tool_calls,
            timestamp: new Date().toISOString()
          }
          this.currentChat.messages.push(assistantMessage)

          if (data.tool_results) {
            for (const toolResult of data.tool_results) {
              const toolMessage = {
                id: crypto.randomUUID(),
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
          id: crypto.randomUUID(),
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

    async sendStreamingMessage(content) {
      this.loading = true
      this.error = null

      if (!this.currentChat) {
        const newChat = await this.createSession()
        this.currentChat = newChat
      }

      const userMsg = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date().toISOString() }
      if (!this.currentChat.messages) {
        this.currentChat.messages = []
      }
      this.currentChat.messages.push(userMsg)

      let assistantMsgIndex = 0
      let toolResultsYielded = false
      const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: '', tool_calls: [], timestamp: new Date().toISOString() }
      this.currentChat.messages.push(assistantMsg)

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/chats/${this.currentChat.chat_id}/llm/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ message: content }),
        })

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          throw new Error(errBody.error || errBody.message || `HTTP ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done: streamDone, value } = await reader.read()
          if (streamDone) break

          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue

            try {
              const data = JSON.parse(trimmed.slice(6))

              if (data.type === 'chunk') {
                const lastAssistant = this.currentChat.messages[assistantMsgIndex]
                if (toolResultsYielded || (lastAssistant && lastAssistant.role === 'assistant' && lastAssistant.tool_calls && lastAssistant.tool_calls.length > 0)) {
                  assistantMsgIndex++
                  const newMsg = { id: crypto.randomUUID(), role: 'assistant', content: '', tool_calls: [], timestamp: new Date().toISOString() }
                  this.currentChat.messages.push(newMsg)
                  toolResultsYielded = false
                }
                if (this.currentChat.messages[assistantMsgIndex]) {
                  this.currentChat.messages[assistantMsgIndex].content += data.content
                }
              } else if (data.type === 'tool_call_start') {
                const currentAssistant = this.currentChat.messages[assistantMsgIndex]
                if (!currentAssistant) continue
                if (toolResultsYielded) {
                  assistantMsgIndex++
                  const newMsg = { id: crypto.randomUUID(), role: 'assistant', content: '', tool_calls: [], timestamp: new Date().toISOString() }
                  this.currentChat.messages.push(newMsg)
                  toolResultsYielded = false
                }
                if (!this.currentChat.messages[assistantMsgIndex].tool_calls) this.currentChat.messages[assistantMsgIndex].tool_calls = []
                let tc = this.currentChat.messages[assistantMsgIndex].tool_calls.find(t => t.id === data.toolCallId)
                if (!tc) {
                  tc = { id: data.toolCallId, function: { name: '', arguments: '' } }
                  this.currentChat.messages[assistantMsgIndex].tool_calls.push(tc)
                }
                tc.function.name = data.name
              } else if (data.type === 'tool_call_arg') {
                const currentAssistant = this.currentChat.messages[assistantMsgIndex]
                if (!currentAssistant) continue
                if (!currentAssistant.tool_calls) currentAssistant.tool_calls = []
                let tc = currentAssistant.tool_calls.find(t => t.id === data.toolCallId)
                if (tc) {
                  tc.function.arguments = data.args
                }
              } else if (data.type === 'tool_call_complete') {
                const currentAssistant = this.currentChat.messages[assistantMsgIndex]
                if (!currentAssistant) continue
                if (!currentAssistant.tool_calls) currentAssistant.tool_calls = []
                const existing = currentAssistant.tool_calls.find(t => t.id === data.toolCallId)
                if (existing) {
                  existing.function.arguments = JSON.stringify(data.input)
                } else {
                  currentAssistant.tool_calls.push({
                    id: data.toolCallId,
                    function: { name: data.function?.name || '', arguments: JSON.stringify(data.input) },
                  })
                }
              } else if (data.type === 'tool_result') {
                toolResultsYielded = true
                const toolMessage = {
                  id: crypto.randomUUID(),
                  role: 'tool',
                  tool_call_id: data.tool_call_id,
                  content: data.content,
                  timestamp: new Date().toISOString(),
                }
                this.currentChat.messages.push(toolMessage)
              } else if (data.type === 'done') {
                if (this.currentChat.messages[assistantMsgIndex]) {
                  this.currentChat.messages[assistantMsgIndex].content = data.content || ''
                  if (!this.currentChat.messages[assistantMsgIndex].tool_calls ||
                      this.currentChat.messages[assistantMsgIndex].tool_calls.length === 0) {
                    delete this.currentChat.messages[assistantMsgIndex].tool_calls
                  }
                }
              } else if (data.type === 'error') {
                throw new Error(data.message)
              }
            } catch (parseError) {
              console.error('Failed to parse SSE event:', parseError)
            }
          }
        }

        return { success: true, data: this.currentChat.messages[assistantMsgIndex]?.content || '' }
      } catch (error) {
        this.error = error.message || 'Failed to send message'

        this.currentChat.messages.pop()
        if (this.currentChat.messages.length > 0) {
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
