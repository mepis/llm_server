import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const useMatrixStore = defineStore('matrix', {
  state: () => ({
    messages: [],
    rooms: [],
    loading: false,
    error: null
  }),

  actions: {
    async listMessages() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/matrix/messages`)
        this.messages = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list messages'
        throw error
      } finally {
        this.loading = false
      }
    },

    async listRooms() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/matrix/rooms`)
        this.rooms = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list rooms'
        throw error
      } finally {
        this.loading = false
      }
    },

    async sendMessage(roomId, content) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post(`${API_URL}/matrix/rooms/${roomId}/messages`, { content })
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send message'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
