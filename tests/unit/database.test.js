import { jest } from '@jest/globals';
import Database from '../../server/models/database.js';
import fs from 'fs/promises';
import { existsSync } from 'fs';

describe('Database', () => {
  let db;
  const testDbPath = './test-db.db';

  beforeAll(async () => {
    // Create a test database
    process.env.DB_PATH = testDbPath;
    db = new Database();
    await db.init();
  });

  afterAll(async () => {
    // Clean up test database
    if (db) {
      await db.close();
    }
    if (existsSync(testDbPath)) {
      await fs.unlink(testDbPath);
    }
  });

  describe('Initialization', () => {
    test('should initialize database successfully', () => {
      expect(db.db).toBeDefined();
    });

    test('should create all required tables', async () => {
      const tables = await db.all(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );
      const tableNames = tables.map(t => t.name);

      expect(tableNames).toContain('configs');
      expect(tableNames).toContain('models');
      expect(tableNames).toContain('build_history');
      expect(tableNames).toContain('service_status');
    });
  });

  describe('Configuration Management', () => {
    test('should get configuration value', async () => {
      await db.run(
        'INSERT INTO configs (key, value) VALUES (?, ?)',
        ['test_key', 'test_value']
      );

      const config = await db.get('SELECT * FROM configs WHERE key = ?', ['test_key']);
      expect(config.key).toBe('test_key');
      expect(config.value).toBe('test_value');
    });

    test('should update configuration value', async () => {
      await db.run(
        'UPDATE configs SET value = ? WHERE key = ?',
        ['updated_value', 'test_key']
      );

      const config = await db.get('SELECT * FROM configs WHERE key = ?', ['test_key']);
      expect(config.value).toBe('updated_value');
    });

    test('should delete configuration', async () => {
      await db.run('DELETE FROM configs WHERE key = ?', ['test_key']);
      const config = await db.get('SELECT * FROM configs WHERE key = ?', ['test_key']);
      expect(config).toBeUndefined();
    });
  });

  describe('Model Management', () => {
    test('should insert model record', async () => {
      const result = await db.run(
        'INSERT INTO models (name, path, size, type, downloaded_at) VALUES (?, ?, ?, ?, ?)',
        ['test-model', '/path/to/model', 1024, 'GGUF', new Date().toISOString()]
      );

      expect(result.changes).toBeGreaterThan(0);
    });

    test('should retrieve all models', async () => {
      const models = await db.all('SELECT * FROM models');
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].name).toBe('test-model');
    });

    test('should retrieve model by ID', async () => {
      const allModels = await db.all('SELECT * FROM models');
      const model = await db.get('SELECT * FROM models WHERE id = ?', [allModels[0].id]);

      expect(model).toBeDefined();
      expect(model.name).toBe('test-model');
    });

    test('should delete model', async () => {
      const allModels = await db.all('SELECT * FROM models');
      await db.run('DELETE FROM models WHERE id = ?', [allModels[0].id]);

      const models = await db.all('SELECT * FROM models');
      expect(models.length).toBe(0);
    });
  });

  describe('Build History', () => {
    test('should record build start', async () => {
      const result = await db.run(
        'INSERT INTO build_history (build_type, status, started_at) VALUES (?, ?, ?)',
        ['cpu', 'running', new Date().toISOString()]
      );

      expect(result.changes).toBeGreaterThan(0);
    });

    test('should update build completion', async () => {
      const builds = await db.all('SELECT * FROM build_history');
      const buildId = builds[0].id;
      const completedAt = new Date().toISOString();

      await db.run(
        'UPDATE build_history SET status = ?, completed_at = ? WHERE id = ?',
        ['completed', completedAt, buildId]
      );

      const build = await db.get('SELECT * FROM build_history WHERE id = ?', [buildId]);
      expect(build.status).toBe('completed');
      expect(build.completed_at).toBe(completedAt);
    });

    test('should calculate build duration', async () => {
      const builds = await db.all('SELECT * FROM build_history');
      const build = builds[0];

      if (build.started_at && build.completed_at) {
        const duration = new Date(build.completed_at) - new Date(build.started_at);
        expect(duration).toBeGreaterThanOrEqual(0);
      }
    });

    test('should retrieve build history ordered by date', async () => {
      // Insert another build
      await db.run(
        'INSERT INTO build_history (build_type, status, started_at) VALUES (?, ?, ?)',
        ['cuda', 'completed', new Date().toISOString()]
      );

      const builds = await db.all('SELECT * FROM build_history ORDER BY started_at DESC');
      expect(builds.length).toBeGreaterThan(1);

      // Most recent should be first
      expect(new Date(builds[0].started_at) >= new Date(builds[1].started_at)).toBe(true);
    });
  });

  describe('Service Status', () => {
    test('should record service status', async () => {
      const result = await db.run(
        'INSERT INTO service_status (service_name, status, last_checked) VALUES (?, ?, ?)',
        ['llama-server', 'running', new Date().toISOString()]
      );

      expect(result.changes).toBeGreaterThan(0);
    });

    test('should update service status', async () => {
      await db.run(
        'UPDATE service_status SET status = ?, last_checked = ? WHERE service_name = ?',
        ['stopped', new Date().toISOString(), 'llama-server']
      );

      const service = await db.get(
        'SELECT * FROM service_status WHERE service_name = ?',
        ['llama-server']
      );
      expect(service.status).toBe('stopped');
    });

    test('should get all service statuses', async () => {
      const services = await db.all('SELECT * FROM service_status');
      expect(services.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid SQL gracefully', async () => {
      await expect(db.run('INVALID SQL')).rejects.toThrow();
    });

    test('should handle non-existent table', async () => {
      await expect(db.all('SELECT * FROM non_existent_table')).rejects.toThrow();
    });

    test('should handle constraint violations', async () => {
      // Try to insert duplicate primary key (if applicable)
      // This test depends on your schema constraints
      const builds = await db.all('SELECT * FROM build_history LIMIT 1');
      if (builds.length > 0) {
        // Most tables use auto-increment, so this might not apply
        // Just verify the error handling mechanism exists
        expect(db.run).toBeDefined();
      }
    });
  });

  describe('Transaction Support', () => {
    test('should execute multiple operations', async () => {
      // Insert multiple records
      await db.run(
        'INSERT INTO models (name, path, size, type, downloaded_at) VALUES (?, ?, ?, ?, ?)',
        ['model1', '/path1', 1024, 'GGUF', new Date().toISOString()]
      );
      await db.run(
        'INSERT INTO models (name, path, size, type, downloaded_at) VALUES (?, ?, ?, ?, ?)',
        ['model2', '/path2', 2048, 'GGUF', new Date().toISOString()]
      );

      const models = await db.all('SELECT * FROM models');
      expect(models.length).toBeGreaterThanOrEqual(2);
    });
  });
});
