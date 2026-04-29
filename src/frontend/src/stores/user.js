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
        this.users = response.data.data || []
        return this.users
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
        this.currentUser = response.data.data
        return response.data.data
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
        const updated = response.data.data
       const index = this.users.findIndex(u => u.id === userId)
          if (index !== -1) {
            this.users[index] = updated
          }
        return updated
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
        this.users = this.users.filter(u => u.id !== userId)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete user'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createUser(userData) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/users', userData)
        const created = response.data.data
        this.users.unshift(created)
        return created
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create user'
        throw error
      } finally {
        this.loading = false
      }
    },

    async addRole(userId, role) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.patch(`/users/${userId}/role`, { role })
        const updated = response.data.data
       const index = this.users.findIndex(u => u.id === userId)
          if (index !== -1) {
            this.users[index] = updated
          }
          return updated
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to add role'
        throw error
      } finally {
        this.loading = false
      }
    },

    async removeRole(userId, role) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.patch(`/users/${userId}/role`, { removeRole: role })
        const updated = response.data.data
        const index = this.users.findIndex(u => u.id === userId)
        if (index !== -1) {
          this.users[index] = updated
        }
        return updated
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to remove role'
        throw error
      } finally {
        this.loading = false
      }
    },

    async resetPassword(userId, newPassword) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post(`/users/${userId}/reset-password`, { password: newPassword })
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to reset password'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
