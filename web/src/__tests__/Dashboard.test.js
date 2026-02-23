import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Dashboard from '../views/Dashboard.vue';
import api from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  default: {
    getSystemInfo: vi.fn(),
    getSystemMetrics: vi.fn(),
  },
}));

describe('Dashboard.vue', () => {
  // Mock return values match what the Axios interceptor returns: { success, data: <payload> }
  const mockSystemInfo = {
    success: true,
    data: {
      platform: 'linux',
      cpu: {
        model: 'Intel Core i7',
        cores: 8,
        architecture: 'x64',
        features: {
          avx2: true,
          avx512: false,
        },
      },
      memory: {
        total: 16777216000,
        available: 8388608000,
      },
      gpu: {
        nvidia: {
          available: true,
          name: 'RTX 3080',
          memory: 10737418240,
        },
        amd: {
          available: false,
        },
      },
      recommendedBuild: 'cuda',
    },
  };

  const mockMetrics = {
    success: true,
    data: {
      cpu: {
        usage: 45.2,
        cores: 8,
      },
      memory: {
        total: 16777216000,
        used: 8388608000,
        free: 8388608000,
      },
      uptime: 86400,
      loadAverage: [1.5, 1.2, 1.0],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.getSystemInfo.mockResolvedValue(mockSystemInfo);
    api.getSystemMetrics.mockResolvedValue(mockMetrics);
  });

  it('renders dashboard header', () => {
    const wrapper = mount(Dashboard);
    expect(wrapper.find('h1').text()).toBe('Dashboard');
  });

  it('displays loading state initially', () => {
    const wrapper = mount(Dashboard);
    expect(wrapper.find('.loading-container').exists()).toBe(true);
  });

  it('fetches system info on mount', async () => {
    mount(Dashboard);

    await vi.waitFor(() => {
      expect(api.getSystemInfo).toHaveBeenCalled();
      expect(api.getSystemMetrics).toHaveBeenCalled();
    });
  });

  it('displays system information after loading', async () => {
    const wrapper = mount(Dashboard);

    await vi.waitFor(() => {
      expect(wrapper.vm.loading).toBe(false);
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.vm.systemInfo).toBeDefined();
    expect(wrapper.vm.systemInfo.cpu.model).toBe('Intel Core i7');
  });

  it('displays CPU metrics correctly', async () => {
    const wrapper = mount(Dashboard);

    await vi.waitFor(() => {
      expect(wrapper.vm.loading).toBe(false);
    });

    expect(wrapper.vm.metrics).toBeDefined();
    expect(wrapper.vm.metrics.cpu.usage).toBe(45.2);
  });

  it('formats bytes correctly', () => {
    const wrapper = mount(Dashboard);
    const formatted = wrapper.vm.formatBytes(1073741824);
    expect(formatted).toBe('1 GB');
  });

  it('calculates memory percentage', async () => {
    const wrapper = mount(Dashboard);

    await vi.waitFor(() => {
      expect(wrapper.vm.loading).toBe(false);
    });

    const percentage = wrapper.vm.getMemoryPercentage();
    expect(percentage).toBe('50.0'); // 50% used
  });

  it('determines correct CPU status class', async () => {
    const wrapper = mount(Dashboard);

    await vi.waitFor(() => {
      expect(wrapper.vm.loading).toBe(false);
    });

    const statusClass = wrapper.vm.getCPUStatusClass();
    expect(statusClass).toBe('normal'); // 45.2% is below medium threshold (50%)
  });

  it('determines correct memory status class', async () => {
    const wrapper = mount(Dashboard);

    await vi.waitFor(() => {
      expect(wrapper.vm.loading).toBe(false);
    });

    const statusClass = wrapper.vm.getMemoryStatusClass();
    expect(statusClass).toBe('normal'); // exactly 50% is NOT > 50, so normal
  });

  it('handles API errors gracefully', async () => {
    api.getSystemInfo.mockRejectedValue(new Error('API Error'));
    api.getSystemMetrics.mockRejectedValue(new Error('API Error'));

    const wrapper = mount(Dashboard);

    await vi.waitFor(() => {
      expect(wrapper.vm.loading).toBe(false);
    });

    expect(wrapper.vm.error).toBeDefined();
  });

  it('cleans up interval on unmount', async () => {
    const wrapper = mount(Dashboard);

    await vi.waitFor(() => {
      expect(wrapper.vm.loading).toBe(false);
    });

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    wrapper.unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
