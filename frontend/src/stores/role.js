import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useRoleStore = defineStore('role', {
  state: () => ({
    roles: [],
    loading: false,
    error: null
  }),

  actions: {
    async listRoles() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/roles')
        this.roles = response.data.data || []
        return this.roles
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to list roles'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createRole(data) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/roles', data)
        const created = response.data.data
        this.roles.push(created)
        return created
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create role'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteRole(name) {
      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/roles/${encodeURIComponent(name)}`)
        this.roles = this.roles.filter(r => r.name !== name)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete role'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
