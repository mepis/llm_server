import { defineStore } from 'pinia'
import apiClient from '@/axios'
import { useAuthStore } from '@/stores/auth'

if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    sessions: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
    currentChat: null,
    loading: false,
    error: null
  }),

  actions: {
    async createSession(name = 'New Chat', persist = true) {
      this.loading = true
      this.error = null
      try {
        let session
        if (persist) {
          const response = await apiClient.post('/chats', { session_name: name })
          session = response.data.data
          if (session?.messages) {
            if (typeof session.messages === 'string') {
              session.messages = JSON.parse(session.messages)
            }
            const merged = []
            for (const msg of session.messages) {
              if (!msg.id) {
                msg.id = msg._id || crypto.randomUUID()
              }
              if (msg.role === 'tool') {
                const lastAssistant = merged.find(m => m.role === 'assistant')
                if (lastAssistant) {
                  if (!lastAssistant.tool_results) lastAssistant.tool_results = []
                  lastAssistant.tool_results.push({ tool_call_id: msg.tool_call_id, content: msg.content })
                }
              } else {
                merged.push(msg)
              }
            }
            session.messages = merged
          }
        } else {
          session = {
            chat_id: crypto.randomUUID(),
            session_name: name,
            messages: [],
            _unsaved: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        this.sessions.unshift(session)
        this.currentChat = session
        return session
      } catch (error) {
        if (persist) {
          this.error = error.response?.data?.message || 'Failed to create session'
        } else {
          this.error = 'Failed to create session'
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async listSessions(options = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/chats', { params: options })
        const data = response.data.data || {}
        this.sessions = data.sessions || []
        this.pagination = {
          total: data.total,
          page: data.page,
          limit: data.limit,
          totalPages: data.totalPages
        }
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
          if (typeof this.currentChat.messages === 'string') {
            this.currentChat.messages = JSON.parse(this.currentChat.messages)
          }
          const merged = []
          for (const msg of this.currentChat.messages) {
            if (!msg.id) {
              msg.id = msg._id || crypto.randomUUID()
            }
            if (msg.role === 'tool') {
              const lastAssistant = merged.find(m => m.role === 'assistant')
              if (lastAssistant) {
                if (!lastAssistant.tool_results) lastAssistant.tool_results = []
                lastAssistant.tool_results.push({ tool_call_id: msg.tool_call_id, content: msg.content })
              }
            } else {
              merged.push(msg)
            }
          }
          this.currentChat.messages = merged
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
        } else if (this.currentChat._unsaved) {
          await this.persistUnsavedSession(this.currentChat.chat_id, 'New Chat')
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

    async persistUnsavedSession(chatId, name) {
      try {
        const response = await apiClient.post('/chats', { session_name: name })
        const persistedSession = response.data.data
        if (persistedSession?.messages) {
          if (typeof persistedSession.messages === 'string') {
            persistedSession.messages = JSON.parse(persistedSession.messages)
          }
          const merged = []
          for (const msg of persistedSession.messages) {
            if (!msg.id) {
              msg.id = msg._id || crypto.randomUUID()
            }
            if (msg.role === 'tool') {
              const lastAssistant = merged.find(m => m.role === 'assistant')
              if (lastAssistant) {
                if (!lastAssistant.tool_results) lastAssistant.tool_results = []
                lastAssistant.tool_results.push({ tool_call_id: msg.tool_call_id, content: msg.content })
              }
            } else {
              merged.push(msg)
            }
          }
          persistedSession.messages = merged
        }
        this.sessions.forEach(s => {
          if (s.chat_id === chatId || s._unsaved) {
            Object.assign(s, persistedSession)
            delete s._unsaved
          }
        })
        if (this.currentChat?.chat_id === chatId) {
          this.currentChat = persistedSession
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to save session'
        throw error
      }
    },

    async sendStreamingMessage(content) {
      this.loading = true
      this.error = null

      if (!this.currentChat) {
        const newChat = await this.createSession()
        this.currentChat = newChat
      } else if (this.currentChat._unsaved) {
        await this.persistUnsavedSession(this.currentChat.chat_id, 'New Chat')
      }

      const userMsg = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date().toISOString() }
      if (!this.currentChat.messages) {
        this.currentChat.messages = []
      }
      const userMsgIndex = this.currentChat.messages.length
      this.currentChat.messages.push(userMsg)

      let assistantMsgIndex = this.currentChat.messages.length
      let toolResultsYielded = false
      const assistantMsg = { id: crypto.randomUUID(), role: 'assistant', content: '', tool_calls: [], timestamp: new Date().toISOString() }
      this.currentChat.messages.push(assistantMsg)

      try {
        let intermediateCount = 0
        const authStore = useAuthStore()
        const token = authStore.token
        if (!token) {
          throw new Error('Not authenticated')
        }
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
                  intermediateCount++
                }
                if (this.currentChat.messages[assistantMsgIndex]) {
                  this.currentChat.messages[assistantMsgIndex].content += data.content
                  if (!this.currentChat.messages[assistantMsgIndex].rawOutput) {
                    this.currentChat.messages[assistantMsgIndex].rawOutput = ''
                  }
                  this.currentChat.messages[assistantMsgIndex].rawOutput += data.content
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
                const currentMsg = this.currentChat.messages[assistantMsgIndex]
                if (currentMsg) {
                  if (!currentMsg.tool_results) currentMsg.tool_results = []
                  currentMsg.tool_results.push({ tool_call_id: data.tool_call_id, content: data.content })
                }
              } else if (data.type === 'done') {
                const newSubject = data.subject
                const startIdx = assistantMsgIndex - intermediateCount
                let unified = this.currentChat.messages[assistantMsgIndex] ||
                  { id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: new Date().toISOString() }

                unified.content = data.content || ''
                if (data.citations && data.citations.length > 0) {
                  unified.metadata = { ...unified.metadata, citations: data.citations }
                } else if (!unified.metadata) {
                  unified.metadata = {}
                }

                const allToolCalls = []
                const allToolResults = []
                for (let i = startIdx; i <= assistantMsgIndex; i++) {
                  const msg = this.currentChat.messages[i]
                  if (!msg || msg.role !== 'assistant') continue
                  if (msg.tool_calls && msg.tool_calls.length) allToolCalls.push(...msg.tool_calls)
                  if (msg.tool_results && msg.tool_results.length) allToolResults.push(...msg.tool_results)
                }

                unified.tool_calls = allToolCalls.length ? allToolCalls : undefined
                unified.tool_results = allToolResults.length ? allToolResults : undefined

                this.currentChat.messages.splice(startIdx, intermediateCount + 1, unified)
                assistantMsgIndex = startIdx
                intermediateCount = 0

                if (newSubject && newSubject.trim()) {
                  this.sessions.forEach(s => {
                    if (s.chat_id === this.currentChat.chat_id || s._id?.toString() === this.currentChat.chat_id) {
                      s.session_name = newSubject.trim()
                    }
                  })
                  this.currentChat.session_name = newSubject.trim()
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

        const assistantMsgIndex = this.currentChat.messages.findIndex(
          (m, i) => i >= userMsgIndex && m.role === 'assistant'
        )
        if (assistantMsgIndex !== -1) {
          this.currentChat.messages.splice(assistantMsgIndex, 1)
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
        this.sessions = this.sessions.filter(s => s.chat_id !== chatId)
        this.pagination.total = Math.max(0, this.pagination.total - 1)
        if (this.currentChat?.chat_id === chatId) {
          this.currentChat = null
        }
        await this.listSessions({ page: this.pagination.page, limit: this.pagination.limit })
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete chat'
        throw error
      } finally {
        this.loading = false
      }
    },

    async bulkDeleteChats(chatIds) {
      this.loading = true
      this.error = null
      try {
        await apiClient.post('/chats/bulk-delete', { sessionIds: chatIds })
        this.sessions = this.sessions.filter(s => !chatIds.includes(s.chat_id))
        if (chatIds.includes(this.currentChat?.chat_id)) {
          this.currentChat = null
        }
        await this.listSessions({ page: this.pagination.page, limit: this.pagination.limit })
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete chats'
        throw error
      } finally {
        this.loading = false
      }
    },

    async regenerateStaleSubjects() {
      try {
        const response = await apiClient.post('/chats/regenerate-subjects')
        const data = response.data.data || {}
        const updated = data.updated || []
        for (const item of updated) {
          this.sessions.forEach(s => {
            if (s.chat_id === item.chat_id || s._id?.toString() === item.chat_id) {
              s.session_name = item.session_name
            }
          })
          if (this.currentChat && (this.currentChat.chat_id === item.chat_id || this.currentChat._id?.toString() === item.chat_id)) {
            this.currentChat.session_name = item.session_name
          }
        }
        return updated.length > 0
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to regenerate subjects'
        throw error
      }
    }
  }
})
