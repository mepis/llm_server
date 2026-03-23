import { ref } from 'vue';
import api from '../api/client';

export function useModels() {
  const searchResults = ref([]);
  const currentModel = ref(null);
  const downloads = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const success = ref(null);

  const searchModels = async (query, limit = 20) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/models/search', {
        params: { query, limit }
      });
      searchResults.value = response.data.models;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to search models';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getModelDetails = async (modelId) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/models/${modelId}`);
      currentModel.value = response.data;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load model details';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const downloadModel = async (modelId, fileName = null) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/models/download', {
        modelId,
        fileName
      });
      success.value = response.data.message;
      await listDownloads();
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to start download';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const listDownloads = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/models/downloads');
      downloads.value = response.data.downloads;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to list downloads';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getDownloadStatus = async (jobId) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/models/download/${jobId}`);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to get download status';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    searchResults,
    currentModel,
    downloads,
    loading,
    error,
    success,
    searchModels,
    getModelDetails,
    downloadModel,
    listDownloads,
    getDownloadStatus
  };
}
