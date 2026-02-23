import { jest } from '@jest/globals';
import * as system from '../../server/utils/system.js';
import os from 'os';

describe('System Utilities', () => {
  describe('getCPUInfo', () => {
    test('should return CPU information', async () => {
      const cpuInfo = await system.getCPUInfo();

      expect(cpuInfo).toHaveProperty('model');
      expect(cpuInfo).toHaveProperty('cores');
      expect(cpuInfo).toHaveProperty('architecture');
      expect(cpuInfo).toHaveProperty('usage');

      expect(typeof cpuInfo.model).toBe('string');
      expect(typeof cpuInfo.cores).toBe('number');
      expect(cpuInfo.cores).toBeGreaterThan(0);
      expect(typeof cpuInfo.architecture).toBe('string');
    });

    test('should return valid CPU usage percentage', async () => {
      const cpuInfo = await system.getCPUInfo();

      expect(cpuInfo.usage).toBeGreaterThanOrEqual(0);
      expect(cpuInfo.usage).toBeLessThanOrEqual(100);
    });
  });

  describe('getMemoryInfo', () => {
    test('should return memory information', () => {
      const memInfo = system.getMemoryInfo();

      expect(memInfo).toHaveProperty('total');
      expect(memInfo).toHaveProperty('free');
      expect(memInfo).toHaveProperty('used');
      expect(memInfo).toHaveProperty('available');

      expect(typeof memInfo.total).toBe('number');
      expect(typeof memInfo.free).toBe('number');
      expect(typeof memInfo.used).toBe('number');
      expect(typeof memInfo.available).toBe('number');
    });

    test('should have total >= used', () => {
      const memInfo = system.getMemoryInfo();
      expect(memInfo.total).toBeGreaterThanOrEqual(memInfo.used);
    });

    test('should have used >= 0', () => {
      const memInfo = system.getMemoryInfo();
      expect(memInfo.used).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detectCPUFeatures', () => {
    test('should detect CPU features', async () => {
      const features = await system.detectCPUFeatures();

      expect(features).toHaveProperty('avx2');
      expect(features).toHaveProperty('avx512');

      expect(typeof features.avx2).toBe('boolean');
      expect(typeof features.avx512).toBe('boolean');
    });
  });

  describe('detectNvidiaGPU', () => {
    test('should return GPU info object', async () => {
      const gpuInfo = await system.detectNvidiaGPU();

      expect(gpuInfo).toHaveProperty('available');
      expect(typeof gpuInfo.available).toBe('boolean');

      if (gpuInfo.available) {
        expect(gpuInfo).toHaveProperty('name');
        expect(gpuInfo).toHaveProperty('memory');
        expect(gpuInfo).toHaveProperty('driver');
        expect(typeof gpuInfo.name).toBe('string');
        expect(typeof gpuInfo.memory).toBe('number');
      }
    });

    test('should handle nvidia-smi not available', async () => {
      const gpuInfo = await system.detectNvidiaGPU();
      // Should not throw, just return available: false
      expect(gpuInfo.available).toBeDefined();
    });
  });

  describe('detectAMDGPU', () => {
    test('should return GPU info object', async () => {
      const gpuInfo = await system.detectAMDGPU();

      expect(gpuInfo).toHaveProperty('available');
      expect(typeof gpuInfo.available).toBe('boolean');

      if (gpuInfo.available) {
        expect(gpuInfo).toHaveProperty('name');
        expect(typeof gpuInfo.name).toBe('string');
      }
    });
  });

  describe('getRecommendedBuild', () => {
    test('should return a valid build type', async () => {
      const buildType = await system.getRecommendedBuild();

      expect(['cpu', 'cuda', 'rocm']).toContain(buildType);
    });

    test('should prefer GPU over CPU', async () => {
      const nvidia = await system.detectNvidiaGPU();
      const amd = await system.detectAMDGPU();
      const recommended = await system.getRecommendedBuild();

      if (nvidia.available) {
        expect(recommended).toBe('cuda');
      } else if (amd.available) {
        expect(recommended).toBe('rocm');
      } else {
        expect(recommended).toBe('cpu');
      }
    });
  });

  describe('getSystemInfo', () => {
    test('should return complete system information', async () => {
      const sysInfo = await system.getSystemInfo();

      expect(sysInfo).toHaveProperty('platform');
      expect(sysInfo).toHaveProperty('cpu');
      expect(sysInfo).toHaveProperty('memory');
      expect(sysInfo).toHaveProperty('gpu');
      expect(sysInfo).toHaveProperty('recommendedBuild');

      expect(typeof sysInfo.platform).toBe('string');
      expect(sysInfo.cpu).toHaveProperty('model');
      expect(sysInfo.cpu).toHaveProperty('features');
      expect(sysInfo.memory).toHaveProperty('total');
      expect(sysInfo.gpu).toHaveProperty('nvidia');
      expect(sysInfo.gpu).toHaveProperty('amd');
    });

    test('should match os.platform()', async () => {
      const sysInfo = await system.getSystemInfo();
      expect(sysInfo.platform).toBe(os.platform());
    });
  });

  describe('getSystemMetrics', () => {
    test('should return real-time metrics', async () => {
      const metrics = await system.getSystemMetrics();

      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('loadAverage');

      expect(metrics.cpu).toHaveProperty('usage');
      expect(metrics.cpu).toHaveProperty('cores');
      expect(Array.isArray(metrics.loadAverage)).toBe(true);
      expect(metrics.loadAverage.length).toBe(3);
    });

    test('should have consistent uptime', async () => {
      const metrics1 = await system.getSystemMetrics();
      await new Promise(resolve => setTimeout(resolve, 100));
      const metrics2 = await system.getSystemMetrics();

      expect(metrics2.uptime).toBeGreaterThanOrEqual(metrics1.uptime);
    });

    test('should return valid load averages', async () => {
      const metrics = await system.getSystemMetrics();

      metrics.loadAverage.forEach(load => {
        expect(typeof load).toBe('number');
        expect(load).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle concurrent calls', async () => {
      const promises = [
        system.getSystemInfo(),
        system.getSystemMetrics(),
        system.getCPUInfo(),
        system.getMemoryInfo(),
      ];

      const results = await Promise.all(promises);
      results.forEach(result => expect(result).toBeDefined());
    });

    test('should handle rapid successive calls', async () => {
      for (let i = 0; i < 5; i++) {
        const metrics = await system.getSystemMetrics();
        expect(metrics).toBeDefined();
      }
    });
  });
});
