import { ref } from 'vue';
import api from '../api/client';

export function useServices() {
  const services = ref([]);
  const logs = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const success = ref(null);

  const listServices = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/services');
      services.value = response.data.services;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load services';
    } finally {
      loading.value = false;
    }
  };

  const createService = async (serviceData) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/services', serviceData);
      success.value = response.data.message;
      await listServices();
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create service';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeService = async (name) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.delete(`/services/${name}`);
      success.value = response.data.message;
      services.value = services.value.filter(s => s.name !== name);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to remove service';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const startService = async (name) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/services/${name}/start`);
      success.value = response.data.message;
      await listServices();
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to start service';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const stopService = async (name) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/services/${name}/stop`);
      success.value = response.data.message;
      await listServices();
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to stop service';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const restartService = async (name) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/services/${name}/restart`);
      success.value = response.data.message;
      await listServices();
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to restart service';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getLogs = async (serviceName, lines = 100) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/services/${serviceName}/logs`, {
        params: { lines }
      });
      logs.value = response.data.logs;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load logs';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    services,
    logs,
    loading,
    error,
    success,
    listServices,
    createService,
    removeService,
    startService,
    stopService,
    restartService,
    getLogs
  };
}
