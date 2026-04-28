import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDebugStore = defineStore('debug', () => {
  const errors = ref([])
  const warnings = ref([])

  function addError(message, stack) {
    errors.value.unshift({
      id: Date.now() + Math.random(),
      message,
      stack: stack || '',
      timestamp: new Date().toISOString()
    })
  }

  function addWarning(message, stack) {
    warnings.value.unshift({
      id: Date.now() + Math.random(),
      message,
      stack: stack || '',
      timestamp: new Date().toISOString()
    })
  }

  function clearErrors() {
    errors.value = []
  }

  function clearWarnings() {
    warnings.value = []
  }

  function clearAll() {
    errors.value = []
    warnings.value = []
  }

  return {
    errors,
    warnings,
    addError,
    addWarning,
    clearErrors,
    clearWarnings,
    clearAll
  }
})
