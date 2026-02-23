import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import systemRoutes from '../../server/routes/system.js';
import llamaRoutes from '../../server/routes/llama.js';
import serviceRoutes from '../../server/routes/service.js';

// Create test app
const app = express();
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// Mount routes
app.use('/api/system', systemRoutes);
app.use('/api/llama', llamaRoutes);
app.use('/api/service', serviceRoutes);

describe('API Integration Tests', () => {
  describe('Health Endpoint', () => {
    test('GET /api/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('System APIs', () => {
    test('GET /api/system/info should return system information', async () => {
      const response = await request(app)
        .get('/api/system/info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('platform');
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('gpu');
      expect(response.body.data).toHaveProperty('recommendedBuild');

      // Verify CPU structure
      expect(response.body.data.cpu).toHaveProperty('model');
      expect(response.body.data.cpu).toHaveProperty('cores');
      expect(response.body.data.cpu).toHaveProperty('architecture');
      expect(response.body.data.cpu).toHaveProperty('features');

      // Verify features
      expect(response.body.data.cpu.features).toHaveProperty('avx2');
      expect(response.body.data.cpu.features).toHaveProperty('avx512');
    });

    test('GET /api/system/metrics should return real-time metrics', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('memory');
      expect(response.body.data).toHaveProperty('uptime');
      expect(response.body.data).toHaveProperty('loadAverage');

      // Verify CPU metrics
      expect(response.body.data.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(response.body.data.cpu.usage).toBeLessThanOrEqual(100);

      // Verify memory metrics
      expect(response.body.data.memory.total).toBeGreaterThan(0);
      expect(response.body.data.memory.used).toBeGreaterThanOrEqual(0);

      // Verify load average is array of 3
      expect(Array.isArray(response.body.data.loadAverage)).toBe(true);
      expect(response.body.data.loadAverage.length).toBe(3);
    });

    test('GET /api/system/metrics should return consistent data types', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .expect(200);

      const { data } = response.body;

      expect(typeof data.cpu.usage).toBe('number');
      expect(typeof data.cpu.cores).toBe('number');
      expect(typeof data.memory.total).toBe('number');
      expect(typeof data.memory.used).toBe('number');
      expect(typeof data.uptime).toBe('number');
    });
  });

  describe('Build APIs', () => {
    test('GET /api/llama/build/status should return build status', async () => {
      const response = await request(app)
        .get('/api/llama/build/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cloned');
      expect(typeof response.body.data.cloned).toBe('boolean');
    });

    test('GET /api/llama/build/history should return build history', async () => {
      const response = await request(app)
        .get('/api/llama/build/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // If there are builds, verify structure
      if (response.body.data.length > 0) {
        const build = response.body.data[0];
        expect(build).toHaveProperty('id');
        expect(build).toHaveProperty('buildType');
        expect(build).toHaveProperty('status');
        expect(build).toHaveProperty('startedAt');
      }
    });

    test('POST /api/llama/build should accept valid build types', async () => {
      const buildTypes = ['auto', 'cpu', 'cuda', 'rocm'];

      for (const buildType of buildTypes) {
        const response = await request(app)
          .post('/api/llama/build')
          .send({ buildType })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('buildId');
      }
    }, 30000); // Increased timeout for multiple build starts

    test('POST /api/llama/build should reject invalid build type', async () => {
      const response = await request(app)
        .post('/api/llama/build')
        .send({ buildType: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('POST /api/llama/build should default to auto if not specified', async () => {
      const response = await request(app)
        .post('/api/llama/build')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /api/llama/build/:buildId should return build output', async () => {
      // First start a build
      const buildResponse = await request(app)
        .post('/api/llama/build')
        .send({ buildType: 'cpu' });

      const buildId = buildResponse.body.data.buildId;

      // Then get its output
      const response = await request(app)
        .get(`/api/llama/build/${buildId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('buildId');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('output');
      expect(Array.isArray(response.body.data.output)).toBe(true);
    });

    test('GET /api/llama/build/:buildId should handle non-existent build', async () => {
      const response = await request(app)
        .get('/api/llama/build/99999999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Service APIs', () => {
    test('GET /api/service/status should return all services', async () => {
      const response = await request(app)
        .get('/api/service/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);

      // Services might be empty if none configured
      if (response.body.data.length > 0) {
        const service = response.body.data[0];
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('active');
        expect(service).toHaveProperty('status');
        expect(typeof service.active).toBe('boolean');
      }
    });

    test('POST /api/service/:name/start should handle service start', async () => {
      const response = await request(app)
        .post('/api/service/llama-server/start')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    test('POST /api/service/:name/stop should handle service stop', async () => {
      const response = await request(app)
        .post('/api/service/llama-server/stop')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    test('POST /api/service/:name/restart should handle service restart', async () => {
      const response = await request(app)
        .post('/api/service/llama-server/restart')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    test('POST /api/service/:name/enable should enable service', async () => {
      const response = await request(app)
        .post('/api/service/llama-server/enable')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    test('POST /api/service/:name/disable should disable service', async () => {
      const response = await request(app)
        .post('/api/service/llama-server/disable')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    test('GET /api/service/:name/logs should return service logs', async () => {
      const response = await request(app)
        .get('/api/service/llama-server/logs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logs');
      expect(Array.isArray(response.body.data.logs)).toBe(true);
    });

    test('should handle service operations for invalid service', async () => {
      const response = await request(app)
        .post('/api/service/non-existent-service/start')
        .expect(200); // May still return 200 but with error in systemctl

      // Just verify response structure
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/llama/build')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    test('should handle missing required parameters', async () => {
      const response = await request(app)
        .post('/api/llama/build')
        .send({ buildType: null })
        .expect(200); // Defaults to auto

      expect(response.body.success).toBe(true);
    });

    test('should return 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/non-existent')
        .expect(404);
    });
  });

  describe('CORS', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should handle OPTIONS requests', async () => {
      await request(app)
        .options('/api/health')
        .expect(204);
    });
  });

  describe('Response Format', () => {
    test('all successful responses should have success: true', async () => {
      const endpoints = [
        '/api/health',
        '/api/system/info',
        '/api/system/metrics',
        '/api/llama/build/status',
        '/api/llama/build/history',
        '/api/service/status',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.body.success).toBe(true);
      }
    });

    test('all responses should have data property when successful', async () => {
      const response = await request(app)
        .get('/api/system/info')
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    test('error responses should have error message', async () => {
      const response = await request(app)
        .post('/api/llama/build')
        .send({ buildType: 'invalid_type' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Performance', () => {
    test('health endpoint should respond quickly', async () => {
      const start = Date.now();
      await request(app).get('/api/health').expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should respond in < 100ms
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get('/api/health'));

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
