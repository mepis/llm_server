import { defineStore } from 'pinia';
import apiClient from '@/axios';
import { useAuthStore } from './auth';

export const useSkillStore = defineStore('skill', {
  state: () => ({
    skills: [],
    currentSkill: null,
    loading: false,
    error: null,
  }),

  getters: {
    hasAdminRole: (state) => {
      const authStore = useAuthStore();
      return authStore.user?.roles?.includes('admin') || false;
    },
  },

  actions: {
    async listSkills() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get('/skills');
        this.skills = response.data.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to load skills';
      } finally {
        this.loading = false;
      }
    },

    async getSkill(name) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get(`/skills/${name}`);
        this.currentSkill = response.data.data;
        return response.data.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to load skill';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createSkill(data) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/skills', data);
        this.skills.unshift(response.data.data);
        return response.data.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to create skill';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateSkill(name, data) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put(`/skills/${name}`, data);
        const updated = response.data.data;
        const index = this.skills.findIndex((s) => s.name === name);
        if (index !== -1) {
          this.skills.splice(index, 1, updated);
        }
        if (this.currentSkill?.name === name) {
          this.currentSkill = updated;
        }
        return updated;
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to update skill';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteSkill(name) {
      this.loading = true;
      this.error = null;
      try {
        await apiClient.delete(`/skills/${name}`);
        this.skills = this.skills.filter((s) => s.name !== name);
        if (this.currentSkill?.name === name) {
          this.currentSkill = null;
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Failed to delete skill';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
