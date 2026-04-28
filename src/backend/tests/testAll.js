const { connectDB, disconnectDB } = require('../config/db');
const knex = () => require('../config/db').getDB();

console.log('Running backend tests...');

const cleanupIds = [];

const cleanupTestData = async () => {
  const db = knex();
  for (const item of cleanupIds) {
    try {
      await db.from(item.table).where({ id: item.id }).del();
    } catch (error) {
      console.log(`  Warning: Failed to clean up ${item.table} ${item.id}:`, error.message);
    }
  }
};

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Database connection
    console.log('\nTest 1: Database connection');
    try {
      await connectDB();
      console.log('Database connected successfully');
      passed++;
    } catch (error) {
      console.log('Database connection failed:', error.message);
      failed++;
    }

    // Test 2: User CRUD
    console.log('\nTest 2: User model');
    try {
      const id = require('uuid').v4();
      const username = 'test_user_' + Date.now();
      await knex().insert({
        id, username, email: username + '@example.com',
        password_hash: 'hashed_password', roles: JSON.stringify(['user']),
      }).into('users');
      cleanupIds.push({ table: 'users', id });

      const user = await knex().from('users').where({ id }).first();
      if (!user || user.username !== username) throw new Error('User not found or mismatch');
      console.log('User model works correctly');
      passed++;
    } catch (error) {
      console.log('User model test failed:', error.message);
      failed++;
    }

    // Test 3: ChatSession CRUD
    console.log('\nTest 3: ChatSession model');
    try {
      const userId = cleanupIds.find(i => i.table === 'users')?.id;
      if (!userId) throw new Error('No user ID available');

      const id = require('uuid').v4();
      await knex().insert({
        id, user_id: userId, session_name: 'Test Session',
        messages: JSON.stringify([]), metadata: JSON.stringify({}),
      }).into('chat_sessions');
      cleanupIds.push({ table: 'chat_sessions', id });

      const session = await knex().from('chat_sessions').where({ id }).first();
      if (!session) throw new Error('Session not found');
      console.log('ChatSession model works correctly');
      passed++;
    } catch (error) {
      console.log('ChatSession model test failed:', error.message);
      failed++;
    }

    // Test 4: RAGDocument CRUD
    console.log('\nTest 4: RAGDocument model');
    try {
      const userId = cleanupIds.find(i => i.table === 'users')?.id;
      if (!userId) throw new Error('No user ID available');

      const id = require('uuid').v4();
      await knex().insert({
        id, user_id: userId, filename: 'test.txt', file_path: '/tmp/test.txt',
        file_size: 1024, file_type: 'txt', content: 'Test content',
        metadata: JSON.stringify({}), status: 'uploaded',
      }).into('rag_documents');
      cleanupIds.push({ table: 'rag_documents', id });

      const doc = await knex().from('rag_documents').where({ id }).first();
      if (!doc) throw new Error('Document not found');
      console.log('RAGDocument model works correctly');
      passed++;
    } catch (error) {
      console.log('RAGDocument model test failed:', error.message);
      failed++;
    }

    // Test 5: Prompt CRUD
    console.log('\nTest 5: Prompt model');
    try {
      const userId = cleanupIds.find(i => i.table === 'users')?.id;
      if (!userId) throw new Error('No user ID available');

      const id = require('uuid').v4();
      await knex().insert({
        id, user_id: userId, name: 'Test Prompt', content: 'Test template',
        type: 'custom', variables: JSON.stringify([]), settings: JSON.stringify({}),
      }).into('prompts');
      cleanupIds.push({ table: 'prompts', id });

      const prompt = await knex().from('prompts').where({ id }).first();
      if (!prompt) throw new Error('Prompt not found');
      console.log('Prompt model works correctly');
      passed++;
    } catch (error) {
      console.log('Prompt model test failed:', error.message);
      failed++;
    }

    // Test 6: Tool CRUD
    console.log('\nTest 6: Tool model');
    try {
      const userId = cleanupIds.find(i => i.table === 'users')?.id;
      if (!userId) throw new Error('No user ID available');

      const id = require('uuid').v4();
      await knex().insert({
        id, user_id: userId, name: 'Test Tool', description: 'Test tool description',
        code: 'console.log("test")', parameters: JSON.stringify([]), is_active: true,
        roles: JSON.stringify(['user']),
      }).into('tools');
      cleanupIds.push({ table: 'tools', id });

      const tool = await knex().from('tools').where({ id }).first();
      if (!tool) throw new Error('Tool not found');
      console.log('Tool model works correctly');
      passed++;
    } catch (error) {
      console.log('Tool model test failed:', error.message);
      failed++;
    }

    // Test 7: JWT utilities
    console.log('\nTest 7: JWT utilities');
    try {
      const jwt = require('../utils/jwt');
      const token = jwt.generateToken('test_id', 'test_user', ['user']);
      const decoded = jwt.decodeToken(token);
      if (decoded.user_id !== 'test_id') throw new Error('JWT user_id mismatch');
      if (decoded.username !== 'test_user') throw new Error('JWT username mismatch');
      console.log('JWT utilities working correctly');
      passed++;
    } catch (error) {
      console.log('JWT utilities test failed:', error.message);
      failed++;
    }

    // Test 8: Security utilities
    console.log('\nTest 8: Security utilities');
    try {
      const security = require('../utils/security');
      const id = security.generateId();
      if (id.length !== 32) throw new Error('Security ID length mismatch');
      console.log('Security utilities working correctly');
      passed++;
    } catch (error) {
      console.log('Security utilities test failed:', error.message);
      failed++;
    }

    console.log('\nCleaning up test data...');
    await cleanupTestData();
    await disconnectDB();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Test Summary');
    console.log('='.repeat(50));
    console.log(`Total: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(50));

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test suite error:', error);
    process.exit(1);
  }
};

runTests();
