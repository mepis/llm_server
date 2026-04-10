import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    users: [],
    currentUser: null,
    loading: false,
    error: null
  }),

  actions: {
    async listUsers() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/users')
        this.users = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list users'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getUserById(userId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get(`/users/${userId}`)
        this.currentUser = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to get user'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateUser(userId, data) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.put(`/users/${userId}`, data)
        const index = this.users.findIndex(u => u._id === userId)
        if (index !== -1) {
          this.users[index] = response.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update user'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteUser(userId) {
      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/users/${userId}`)
        this.users = this.users.filter(u => u._id !== userId)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete user'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
