import { ref, reactive } from 'vue';
import api from '../api/client';

export function useScripts() {
  const scripts = ref([]);
  const currentScript = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const success = ref(null);

  const listScripts = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/scripts');
      scripts.value = response.data.scripts;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load scripts';
    } finally {
      loading.value = false;
    }
  };

  const getScript = async (name) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get(`/scripts/${name}`);
      currentScript.value = response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to load script';
    } finally {
      loading.value = false;
    }
  };

  const createScript = async (scriptData) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/scripts', scriptData);
      success.value = response.data.message;
      await listScripts();
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create script';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateScript = async (name, scriptData) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.put(`/scripts/${name}`, scriptData);
      success.value = response.data.message;
      await getScript(name);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to update script';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteScript = async (name) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.delete(`/scripts/${name}`);
      success.value = response.data.message;
      scripts.value = scripts.value.filter(s => s.name !== name);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to delete script';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const runScript = async (name, background = false) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/scripts/${name}/run?background=${background}`);
      success.value = response.data.message || 'Script executed successfully';
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to run script';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    scripts,
    currentScript,
    loading,
    error,
    success,
    listScripts,
    getScript,
    createScript,
    updateScript,
    deleteScript,
    runScript
  };
}
