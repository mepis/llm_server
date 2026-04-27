const { v4: uuidv4 } = require('uuid');

/**
 * Create all tables if they don't exist
 */
async function createTables(knex) {
  await knex.raw(`CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    is_builtin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    matrix_username VARCHAR(100),
    roles JSON DEFAULT '["user"]',
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSON DEFAULT '{"theme":"light","default_model":"llama-3-8b","language":"en","chat_page_size":10}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_name VARCHAR(100) NOT NULL,
    messages JSON DEFAULT '[]',
    memory JSON DEFAULT '{"conversation_summary":"","key_points":[],"entities":[],"preferences":{}}',
    metadata JSON DEFAULT '{"model":"llama-3-8b","temperature":0.7,"max_tokens":2048,"top_p":0.9}',
    rag_enabled BOOLEAN DEFAULT FALSE,
    rag_document_ids JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_session_name (session_name),
    INDEX idx_created_at (created_at)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    role ENUM('system','user','assistant','tool') NOT NULL,
    content LONGTEXT,
    metadata JSON DEFAULT '{}',
    tool_calls JSON,
    tool_call_id VARCHAR(255),
    model VARCHAR(100),
    citations JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_session_id_created_at (session_id, created_at),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(36) PRIMARY KEY,
    log_level ENUM('error','warn','info','debug') NOT NULL,
    service VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    metadata JSON DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_log_level_timestamp (log_level, timestamp),
    INDEX idx_service_timestamp (service, timestamp)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS prompts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('system','user','assistant','custom') DEFAULT 'custom',
    variables JSON DEFAULT '[]',
    settings JSON DEFAULT '{}',
    tags JSON DEFAULT '[]',
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id_created_at (user_id, created_at)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS tools (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    code TEXT NOT NULL,
    parameters JSON DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    roles JSON DEFAULT '["user"]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id_created_at (user_id, created_at),
    INDEX idx_name (name),
    INDEX idx_roles (roles(10))
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS tool_calls (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    tool_call_id VARCHAR(255) NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    input JSON NOT NULL,
    state ENUM('pending','running','completed','error') DEFAULT 'pending',
    output TEXT DEFAULT '',
    error TEXT,
    title VARCHAR(255),
    metadata JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id_message_id (session_id, message_id),
    INDEX idx_tool_call_id (tool_call_id)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS rag_documents (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    content LONGTEXT,
    metadata JSON DEFAULT '{}',
    status ENUM('uploaded','processing','indexed','failed') DEFAULT 'uploaded',
    error_message TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    embedding_model VARCHAR(100) DEFAULT 'all-MiniLM-L6-v2',
    group_ids JSON DEFAULT '[]',
    INDEX idx_user_id_created_at (user_id, uploaded_at),
    INDEX idx_filename (filename(100)),
    INDEX idx_status (status),
    INDEX idx_group_ids_status (group_ids(10), status)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS matrix_messages (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    message_type ENUM('m.text','m.image','m.file','m.emote') DEFAULT 'm.text',
    is_incoming BOOLEAN NOT NULL,
    sender_display_name VARCHAR(100),
    attachments JSON DEFAULT '[]',
    metadata JSON DEFAULT '{}',
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    status ENUM('received','processing','processed','error') DEFAULT 'received',
    error_message TEXT,
    INDEX idx_room_id_received_at (room_id, received_at),
    INDEX idx_user_id_received_at (user_id, received_at),
    INDEX idx_is_incoming (is_incoming),
    INDEX idx_status (status)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS configs (
    id VARCHAR(36) PRIMARY KEY,
    \`key\` VARCHAR(255) NOT NULL UNIQUE,
    value TEXT DEFAULT '',
    category ENUM('server','database','auth','llama','tts','matrix','session','logging') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS document_groups (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT '',
    owner_id VARCHAR(36) NOT NULL,
    visibility ENUM('private','team','public') DEFAULT 'private',
    members JSON DEFAULT '[]',
    documents JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    INDEX idx_visibility (visibility),
    UNIQUE INDEX idx_name_owner (name, owner_id)
  ) ENGINE=InnoDB`);

  await knex.raw(`CREATE TABLE IF NOT EXISTS user_memories (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    layer ENUM('episodic','semantic','procedural') NOT NULL,
    content TEXT NOT NULL,
    embedding JSON DEFAULT '[]',
    metadata JSON DEFAULT '{}',
    tags JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id_layer_created (user_id, layer, created_at),
    INDEX idx_metadata_expires_at (metadata(10)),
    FULLTEXT INDEX idx_content_search (content),
    INDEX idx_tags (tags(10))
  ) ENGINE=InnoDB`);

  console.log('All tables created successfully');
}

/**
 * Migrate existing chat messages from JSON column to chat_messages table
 */
async function migrateChatMessages(knex) {
  const sessions = await knex('chat_sessions').select('id', 'messages');

  for (const session of sessions) {
    let messages = [];
    try {
      messages = typeof session.messages === 'string'
        ? JSON.parse(session.messages)
        : (session.messages || []);
    } catch {
      continue;
    }

    if (messages.length === 0) continue;

    for (const msg of messages) {
      await knex('chat_messages').insert({
        id: uuidv4(),
        session_id: session.id,
        role: msg.role || 'user',
        content: msg.content || '',
        metadata: msg.metadata ? JSON.stringify(msg.metadata) : '{}',
        tool_calls: msg.tool_calls ? JSON.stringify(msg.tool_calls) : null,
        tool_call_id: msg.tool_call_id || null,
        model: msg.metadata?.model || null,
        citations: msg.metadata?.citations ? JSON.stringify(msg.metadata.citations) : null,
        created_at: msg.timestamp || new Date(),
      });
    }
  }

  console.log(`Migrated messages for ${sessions.length} sessions`);
}

/**
 * Drop all tables (for testing/migration)
 */
async function dropTables(knex) {
  const tables = [
    'user_memories',
    'document_groups',
    'configs',
    'matrix_messages',
    'rag_documents',
    'tool_calls',
    'tools',
    'prompts',
    'logs',
    'chat_messages',
    'chat_sessions',
    'users',
    'roles',
  ];

  for (const table of tables) {
    await knex.raw(`DROP TABLE IF EXISTS ${table}`);
  }

  console.log('All tables dropped');
}

module.exports = { createTables, dropTables, migrateChatMessages };
