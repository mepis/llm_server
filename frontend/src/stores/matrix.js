import { defineStore } from 'pinia'
import apiClient from '@/axios'

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
        const response = await apiClient.get('/matrix/messages')
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
        const response = await apiClient.get('/matrix/rooms')
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
        const response = await apiClient.post(`/matrix/rooms/${roomId}/messages`, { content })
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
