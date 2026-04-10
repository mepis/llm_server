import { useDebugStore } from '@/stores/debug'

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
}

let initialized = false

export function initConsoleInterceptor() {
  if (initialized) {
    return
  }

  const debugMenuEnabled = import.meta.env.VITE_DEBUG_MENU_ENABLED === 'true'
  if (!debugMenuEnabled) {
    return
  }

  const debugStore = useDebugStore()

  console.log = (...args) => {
    debugStore.addMessage('log', ...args)
    originalConsole.log(...args)
  }

  console.error = (...args) => {
    debugStore.addMessage('error', ...args)
    originalConsole.error(...args)
  }

  console.warn = (...args) => {
    debugStore.addMessage('warn', ...args)
    originalConsole.warn(...args)
  }

  console.info = (...args) => {
    debugStore.addMessage('info', ...args)
    originalConsole.info(...args)
  }

  console.debug = (...args) => {
    debugStore.addMessage('debug', ...args)
    originalConsole.debug(...args)
  }

  initialized = true
}

export function getOriginalConsole() {
  return originalConsole
}
