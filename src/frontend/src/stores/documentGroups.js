import { defineStore } from 'pinia'
import apiClient from '@/axios'

export const useDocumentGroupsStore = defineStore('documentGroups', {
  state: () => ({
    groups: [],
    currentGroup: null,
    accessibleDocs: [],
    loading: false,
    error: null
  }),

  actions: {
    async createGroup(name, description = '', visibility = 'private') {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post('/document-groups', { name, description, visibility })
        this.groups.unshift(response.data.data)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to create group'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchGroups() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/document-groups')
        this.groups = response.data.data || []
        return this.groups
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch groups'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchGroup(id) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get(`/document-groups/${id}`)
        this.currentGroup = response.data.data
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch group'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateGroup(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.patch(`/document-groups/${id}`, data)
        const updated = response.data.data
        const index = this.groups.findIndex(g => g._id === id)
        if (index !== -1) {
          this.groups[index] = updated
        }
        if (this.currentGroup?._id === id) {
          this.currentGroup = updated
        }
        return updated
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update group'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteGroup(id) {
      this.loading = true
      this.error = null
      try {
        await apiClient.delete(`/document-groups/${id}`)
        this.groups = this.groups.filter(g => g._id !== id)
        if (this.currentGroup?._id === id) {
          this.currentGroup = null
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to delete group'
        throw error
      } finally {
        this.loading = false
      }
    },

    async addMember(groupId, userId, role = 'viewer') {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post(`/document-groups/${groupId}/members`, { user_id: userId, role })
        if (this.currentGroup?._id === groupId) {
          this.currentGroup = response.data.data
        }
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to add member'
        throw error
      } finally {
        this.loading = false
      }
    },

    async removeMember(groupId, userId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.delete(`/document-groups/${groupId}/members/${userId}`)
        if (this.currentGroup?._id === groupId) {
          this.currentGroup = response.data.data
        }
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to remove member'
        throw error
      } finally {
        this.loading = false
      }
    },

    async transferOwnership(groupId, newOwnerId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post(`/document-groups/${groupId}/transfer`, { new_owner_id: newOwnerId })
        if (this.currentGroup?._id === groupId) {
          this.currentGroup = response.data.data
        }
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to transfer ownership'
        throw error
      } finally {
        this.loading = false
      }
    },

    async addDocument(groupId, documentId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.post(`/document-groups/${groupId}/documents`, { document_id: documentId })
        if (this.currentGroup?._id === groupId) {
          this.currentGroup = response.data.data
        }
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to add document'
        throw error
      } finally {
        this.loading = false
      }
    },

    async removeDocument(groupId, documentId) {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.delete(`/document-groups/${groupId}/documents/${documentId}`)
        if (this.currentGroup?._id === groupId) {
          this.currentGroup = response.data.data
        }
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to remove document'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAccessibleDocs() {
      this.loading = true
      this.error = null
      try {
        const response = await apiClient.get('/document-groups/accessible')
        this.accessibleDocs = response.data.data || []
        return this.accessibleDocs
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to fetch accessible docs'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
