import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import api from '../services/api';

// Mock axios
vi.mock('axios');

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('System APIs', () => {
    it('getHealth() should call correct endpoint', async () => {
      const mockResponse = { data: { success: true, data: { status: 'healthy' } } };
      axios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue(mockResponse),
      }));

      const response = await api.getHealth();
      expect(response.data.success).toBe(true);
    });

    it('getSystemInfo() should return system information', async () => {
      const mockData = {
        platform: 'linux',
        cpu: { model: 'Intel Core i7', cores: 8 },
      };

      axios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: { success: true, data: mockData } }),
      }));

      const response = await api.getSystemInfo();
      expect(response.data.data.platform).toBe('linux');
    });

    it('getSystemMetrics() should return metrics', async () => {
      const mockData = {
        cpu: { usage: 50 },
        memory: { total: 16777216000 },
      };

      axios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: { success: true, data: mockData } }),
      }));

      const response = await api.getSystemMetrics();
      expect(response.data.data.cpu.usage).toBe(50);
    });
  });

  describe('Build APIs', () => {
    it('buildLlama() should post with build type', async () => {
      const mockResponse = { data: { success: true, data: { buildId: '123' } } };

      axios.create = vi.fn(() => ({
        post: vi.fn().mockResolvedValue(mockResponse),
      }));

      const response = await api.buildLlama('cuda');
      expect(response.data.data.buildId).toBe('123');
    });

    it('getBuildStatus() should return build status', async () => {
      const mockData = { cloned: true, lastBuild: '2024-01-01' };

      axios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: { success: true, data: mockData } }),
      }));

      const response = await api.getBuildStatus();
      expect(response.data.data.cloned).toBe(true);
    });

    it('getBuildHistory() should return build history', async () => {
      const mockData = [
        { id: 1, buildType: 'cpu', status: 'completed' },
        { id: 2, buildType: 'cuda', status: 'running' },
      ];

      axios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: { success: true, data: mockData } }),
      }));

      const response = await api.getBuildHistory();
      expect(response.data.data.length).toBe(2);
    });
  });

  describe('Service APIs', () => {
    it('getServiceStatus() should return all services', async () => {
      const mockData = [
        { name: 'llama-server', active: true, status: 'running' },
      ];

      axios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: { success: true, data: mockData } }),
      }));

      const response = await api.getServiceStatus();
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('startService() should post to start endpoint', async () => {
      const mockResponse = { data: { success: true, message: 'Service started' } };

      axios.create = vi.fn(() => ({
        post: vi.fn().mockResolvedValue(mockResponse),
      }));

      const response = await api.startService('llama-server');
      expect(response.data.success).toBe(true);
    });

    it('stopService() should post to stop endpoint', async () => {
      const mockResponse = { data: { success: true, message: 'Service stopped' } };

      axios.create = vi.fn(() => ({
        post: vi.fn().mockResolvedValue(mockResponse),
      }));

      const response = await api.stopService('llama-server');
      expect(response.data.success).toBe(true);
    });
  });

  describe('Model APIs', () => {
    it('searchHuggingFace() should search for models', async () => {
      const mockData = [
        { name: 'llama-7b', size: 7000000000, downloads: 1000 },
      ];

      axios.create = vi.fn(() => ({
        post: vi.fn().mockResolvedValue({ data: { success: true, data: mockData } }),
      }));

      const response = await api.searchHuggingFace('llama');
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('downloadModel() should post download request', async () => {
      const mockResponse = { data: { success: true, message: 'Download started' } };

      axios.create = vi.fn(() => ({
        post: vi.fn().mockResolvedValue(mockResponse),
      }));

      const response = await api.downloadModel('llama-7b');
      expect(response.data.success).toBe(true);
    });

    it('getModels() should return local models', async () => {
      const mockData = [
        { id: 1, name: 'llama-7b', downloaded: true },
      ];

      axios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: { success: true, data: mockData } }),
      }));

      const response = await api.getModels();
      expect(response.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      axios.create = vi.fn(() => ({
        get: vi.fn().mockRejectedValue(new Error('Network error')),
      }));

      await expect(api.getHealth()).rejects.toThrow('Network error');
    });

    it('should handle 404 errors', async () => {
      axios.create = vi.fn(() => ({
        get: vi.fn().mockRejectedValue({ response: { status: 404 } }),
      }));

      await expect(api.getHealth()).rejects.toHaveProperty('response.status', 404);
    });

    it('should handle 500 errors', async () => {
      axios.create = vi.fn(() => ({
        post: vi.fn().mockRejectedValue({ response: { status: 500 } }),
      }));

      await expect(api.buildLlama('cpu')).rejects.toHaveProperty('response.status', 500);
    });
  });
});
