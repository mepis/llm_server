import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

function captureTrace() {
  try {
    const error = new Error()
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, captureTrace)
    }
    const stack = error.stack || ''
    const lines = stack.split('\n')
    const trace = lines.slice(1).map(line => line.trim()).filter(line => line.length > 0)
    return trace.join('\n')
  } catch {
    return null
  }
}

export const useDebugStore = defineStore('debug', {
  state: () => ({
    messages: [],
    visible: false,
    filterLevel: 'all',
    searchText: '',
    maxMessages: 500
  }),

  getters: {
    filteredMessages: (state) => {
      return state.messages.filter(msg => {
        const levelMatch = state.filterLevel === 'all' || msg.level === state.filterLevel
        const searchMatch = !state.searchText || 
          msg.fullMessage.toLowerCase().includes(state.searchText.toLowerCase()) ||
          (msg.stack && msg.stack.toLowerCase().includes(state.searchText.toLowerCase())) ||
          (msg.trace && msg.trace.toLowerCase().includes(state.searchText.toLowerCase()))
        return levelMatch && searchMatch
      }).reverse()
    },
    messageCount: (state) => {
      return state.messages.length
    },
    errorCount: (state) => {
      return state.messages.filter(msg => msg.level === 'error').length
    },
    warnCount: (state) => {
      return state.messages.filter(msg => msg.level === 'warn').length
    },
    infoCount: (state) => {
      return state.messages.filter(msg => msg.level === 'info').length
    }
  },

  actions: {
    addMessage(level, message, ...args) {
      const allArgs = [message, ...args]
      
      const formattedArgs = allArgs.map(arg => {
        if (arg instanceof Error) {
          return arg.toString()
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      })

      const fullMessage = formattedArgs.join(' ')
      
      const errorStacks = allArgs
        .filter(arg => arg instanceof Error)
        .map(err => err.stack)
        .join('\n\n')
      
      const trace = captureTrace()

      const msg = {
        id: Date.now() + Math.random(),
        level,
        fullMessage,
        formattedArgs,
        timestamp: new Date().toISOString(),
        stack: errorStacks || null,
        trace
      }

      this.messages.push(msg)

      if (this.messages.length > this.maxMessages) {
        this.messages = this.messages.slice(-this.maxMessages)
      }
    },

    formatArgs(arg) {
      if (typeof arg === 'string') return arg
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    },

    toggle() {
      this.visible = !this.visible
    },

    hide() {
      this.visible = false
    },

    show() {
      this.visible = true
    },

    clear() {
      this.messages = []
    },

    setFilter(level) {
      this.filterLevel = level
    },

    setSearch(text) {
      this.searchText = text
    }
  }
})
