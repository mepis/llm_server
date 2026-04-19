import { defineStore } from 'pinia';
import apiClient from '@/axios';
import { useAuthStore } from './auth';

export const useToolStore = defineStore('tool', {
  state: () => ({
    tools: [],
    currentTool: null,
    loading: false,
    error: null,
  }),

  getters: {
    hasAdminRole: (state) => {
      const authStore = useAuthStore();
      return authStore.user?.roles?.includes('admin') || false;
    },

    canExecuteTool: (state) => (tool) => {
      const authStore = useAuthStore();
      const userRoles = authStore.user?.roles || ['user'];
      const toolRoles = tool?.roles || ['user'];
      return toolRoles.some((role) => userRoles.includes(role));
    },
  },

  actions: {
    async createTool(data) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/tools', data);
        this.tools.unshift(response.data.data);
        return response.data.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to create tool';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async listTools() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get('/tools');
        this.tools = response.data.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to load tools';
      } finally {
        this.loading = false;
      }
    },

    async getToolById(toolId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get(`/tools/${toolId}`);
        this.currentTool = response.data.data;
        return response.data.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to load tool';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateTool(toolId, data) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put(`/tools/${toolId}`, data);
        const updated = response.data.data;
        const index = this.tools.findIndex((t) => t._id === toolId);
        if (index !== -1) {
          this.tools.splice(index, 1, updated);
        }
        if (this.currentTool?._id === toolId) {
          this.currentTool = updated;
        }
        return updated;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update tool';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteTool(toolId) {
      this.loading = true;
      this.error = null;
      try {
        await apiClient.delete(`/tools/${toolId}`);
        this.tools = this.tools.filter((t) => t._id !== toolId);
        if (this.currentTool?._id === toolId) {
          this.currentTool = null;
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to delete tool';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async executeTool(toolId, params) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post(`/tools/call/${toolId}`, params);
        return response.data.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to execute tool';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
