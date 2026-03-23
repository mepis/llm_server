import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../api/client';

export const useDownloadStore = defineStore('downloads', () => {
  const activeDownloads = ref([]);
  const completedDownloads = ref([]);
  const failedDownloads = ref([]);

  const allDownloads = computed(() => [
    ...activeDownloads.value,
    ...completedDownloads.value,
    ...failedDownloads.value
  ]);

  const addDownload = (download) => {
    activeDownloads.value.push(download);
  };

  const updateDownload = (jobId, updates) => {
    const index = activeDownloads.value.findIndex(d => d.jobId === jobId);
    if (index !== -1) {
      activeDownloads.value[index] = {
        ...activeDownloads.value[index],
        ...updates
      };

      if (updates.status === 'completed') {
        completedDownloads.value.unshift(
          activeDownloads.value.splice(index, 1)[0]
        );
      } else if (updates.status === 'failed') {
        failedDownloads.value.unshift(
          activeDownloads.value.splice(index, 1)[0]
        );
      }
    }
  };

  const removeDownload = (jobId) => {
    activeDownloads.value = activeDownloads.value.filter(d => d.jobId !== jobId);
    completedDownloads.value = completedDownloads.value.filter(d => d.jobId !== jobId);
    failedDownloads.value = failedDownloads.value.filter(d => d.jobId !== jobId);
  };

  const pollDownloads = async () => {
    try {
      const response = await api.get('/models/downloads');
      response.data.downloads.forEach(download => {
        const existing = activeDownloads.value.find(d => d.jobId === download.jobId);
        if (existing) {
          updateDownload(download.jobId, {
            progress: download.progress,
            status: download.status
          });
        }
      });
    } catch (err) {
      console.error('Failed to poll downloads:', err);
    }
  };

  return {
    activeDownloads,
    completedDownloads,
    failedDownloads,
    allDownloads,
    addDownload,
    updateDownload,
    removeDownload,
    pollDownloads
  };
});
