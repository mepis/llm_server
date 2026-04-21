import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    autoPlayTTS: localStorage.getItem('autoPlayTTS') === 'true'
  }),

  actions: {
    setAutoPlayTTS(value) {
      this.autoPlayTTS = value
      localStorage.setItem('autoPlayTTS', String(value))
    }
  }
})
