import { useDebugStore } from '@/stores/debug'

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}

let initialized = false
let messageQueue = []
let isProcessingQueue = false

function processMessageQueue() {
  if (isProcessingQueue || messageQueue.length === 0) return
  isProcessingQueue = true
  try {
    const debugStore = useDebugStore()
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift()
      debugStore.addMessage(msg.level, msg.message, ...msg.args)
    }
  } finally {
    isProcessingQueue = false
  }
}

export function initConsoleInterceptor() {
  if (initialized) {
    return
  }

  const debugMenuEnabled = import.meta.env.VITE_DEBUG_MENU_ENABLED === 'true'
  if (!debugMenuEnabled) {
    return
  }

  console.log = (...args) => {
    messageQueue.push({ level: 'log', message: args[0], args: args.slice(1) })
    processMessageQueue()
    originalConsole.log(...args)
  }

  console.error = (...args) => {
    messageQueue.push({ level: 'error', message: args[0], args: args.slice(1) })
    processMessageQueue()
    originalConsole.error(...args)
  }

  console.warn = (...args) => {
    messageQueue.push({ level: 'warn', message: args[0], args: args.slice(1) })
    processMessageQueue()
    originalConsole.warn(...args)
  }

  console.info = (...args) => {
    messageQueue.push({ level: 'info', message: args[0], args: args.slice(1) })
    processMessageQueue()
    originalConsole.info(...args)
  }

  console.debug = (...args) => {
    messageQueue.push({ level: 'debug', message: args[0], args: args.slice(1) })
    processMessageQueue()
    originalConsole.debug(...args)
  }

  initialized = true
}

export function getOriginalConsole() {
  return originalConsole
}
