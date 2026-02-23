/**
 * Database Module
 * Handles SQLite database initialization and operations using sql.js
 */

import initSqlJs from 'sql.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || './data/llm_server.db';
    this.SQL = null;
  }

  /**
   * Initialize the database
   */
  async init() {
    try {
      // Initialize sql.js
      this.SQL = await initSqlJs();

      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      await fs.mkdir(dataDir, { recursive: true });

      // Try to load existing database
      try {
        const dbBuffer = await fs.readFile(this.dbPath);
        this.db = new this.SQL.Database(dbBuffer);
        console.log(`Database loaded from ${this.dbPath}`);
      } catch (err) {
        // Create new database if file doesn't exist
        this.db = new this.SQL.Database();
        console.log('Created new database');
      }

      // Initialize schema
      await this.initSchema();

      // Save database to disk
      await this.save();

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema
   */
  async initSchema() {
    const schema = `
      -- Config settings table
      CREATE TABLE IF NOT EXISTS configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT CHECK(type IN ('string', 'number', 'boolean', 'json')),
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Models table
      CREATE TABLE IF NOT EXISTS models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        repo_id TEXT UNIQUE NOT NULL,
        filename TEXT,
        file_path TEXT,
        size_bytes INTEGER,
        downloaded BOOLEAN DEFAULT 0,
        download_progress INTEGER DEFAULT 0,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Build history table
      CREATE TABLE IF NOT EXISTS build_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        build_type TEXT CHECK(build_type IN ('cpu', 'cuda', 'rocm')),
        status TEXT CHECK(status IN ('in_progress', 'success', 'failed')),
        log_output TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      );

      -- Service status table
      CREATE TABLE IF NOT EXISTS service_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_name TEXT UNIQUE NOT NULL,
        status TEXT CHECK(status IN ('running', 'stopped', 'error')),
        pid INTEGER,
        last_check DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_configs_key ON configs(key);
      CREATE INDEX IF NOT EXISTS idx_models_repo_id ON models(repo_id);
      CREATE INDEX IF NOT EXISTS idx_build_history_status ON build_history(status);
      CREATE INDEX IF NOT EXISTS idx_service_status_name ON service_status(service_name);
    `;

    this.db.run(schema);
  }

  /**
   * Save database to disk
   */
  async save() {
    try {
      const data = this.db.export();
      await fs.writeFile(this.dbPath, data);
    } catch (error) {
      console.error('Error saving database:', error);
      throw error;
    }
  }

  /**
   * Execute a SQL query
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Array} Results
   */
  query(sql, params = []) {
    try {
      const results = this.db.exec(sql, params);
      return results;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  /**
   * Run a SQL statement (INSERT, UPDATE, DELETE)
   * @param {string} sql - SQL statement
   * @param {Array} params - Statement parameters
   * @returns {Object} Result info
   */
  async run(sql, params = []) {
    try {
      this.db.run(sql, params);
      await this.save(); // Save after each write operation
      return {
        changes: this.db.getRowsModified(),
        lastInsertId: this.getLastInsertId()
      };
    } catch (error) {
      console.error('Run error:', error);
      throw error;
    }
  }

  /**
   * Get the last insert ID
   * @returns {number} Last insert ID
   */
  getLastInsertId() {
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0]?.values[0]?.[0] || null;
  }

  /**
   * Get a single row
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object|null} Single row or null
   */
  get(sql, params = []) {
    const results = this.query(sql, params);
    if (results.length === 0 || results[0].values.length === 0) {
      return null;
    }

    const columns = results[0].columns;
    const values = results[0].values[0];

    return columns.reduce((obj, col, idx) => {
      obj[col] = values[idx];
      return obj;
    }, {});
  }

  /**
   * Get all rows
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Array} All rows
   */
  all(sql, params = []) {
    const results = this.query(sql, params);
    if (results.length === 0) {
      return [];
    }

    const columns = results[0].columns;
    return results[0].values.map(row => {
      return columns.reduce((obj, col, idx) => {
        obj[col] = row[idx];
        return obj;
      }, {});
    });
  }

  /**
   * Close the database
   */
  async close() {
    if (this.db) {
      await this.save();
      this.db.close();
      this.db = null;
    }
  }
}

// Create and export a singleton instance
const db = new Database();

export default db;
