const assert = require('assert');
const mongoose = require('mongoose');
const config = require('../config/database');
const db = require('../config/db');

console.log('Running backend tests...');

const runTests = async () => {
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Database connection
    console.log('\nTest 1: Database connection');
    try {
      await db.connectDB();
      console.log('✓ Database connected successfully');
      passed++;
    } catch (error) {
      console.log('✗ Database connection failed:', error.message);
      failed++;
    }
    
    // Test 2: User model
    console.log('\nTest 2: User model');
    try {
      const User = require('../models/User');
      const user = new User({
        username: 'test_user',
        email: 'test@example.com',
        password: 'hashed_password',
        roles: ['user']
      });
      await user.save();
      console.log('✓ User created successfully');
      passed++;
      
      // Clean up
      await User.findByIdAndDelete(user._id);
    } catch (error) {
      console.log('✗ User model test failed:', error.message);
      failed++;
    }
    
    // Test 3: ChatSession model
    console.log('\nTest 3: ChatSession model');
    try {
      const ChatSession = require('../models/ChatSession');
      const session = new ChatSession({
        title: 'Test Session',
        messages: []
      });
      await session.save();
      console.log('✓ ChatSession created successfully');
      passed++;
      
      // Clean up
      await ChatSession.findByIdAndDelete(session._id);
    } catch (error) {
      console.log('✗ ChatSession model test failed:', error.message);
      failed++;
    }
    
    // Test 4: RAGDocument model
    console.log('\nTest 4: RAGDocument model');
    try {
      const RAGDocument = require('../models/RAGDocument');
      const doc = new RAGDocument({
        name: 'Test Document',
        content: 'Test content',
        metadata: {}
      });
      await doc.save();
      console.log('✓ RAGDocument created successfully');
      passed++;
      
      // Clean up
      await RAGDocument.findByIdAndDelete(doc._id);
    } catch (error) {
      console.log('✗ RAGDocument model test failed:', error.message);
      failed++;
    }
    
    // Test 5: Prompt model
    console.log('\nTest 5: Prompt model');
    try {
      const Prompt = require('../models/Prompt');
      const prompt = new Prompt({
        name: 'Test Prompt',
        template: 'Test template'
      });
      await prompt.save();
      console.log('✓ Prompt created successfully');
      passed++;
      
      // Clean up
      await Prompt.findByIdAndDelete(prompt._id);
    } catch (error) {
      console.log('✗ Prompt model test failed:', error.message);
      failed++;
    }
    
    // Test 6: Tool model
    console.log('\nTest 6: Tool model');
    try {
      const Tool = require('../models/Tool');
      const tool = new Tool({
        name: 'Test Tool',
        description: 'Test tool description',
        config: {}
      });
      await tool.save();
      console.log('✓ Tool created successfully');
      passed++;
      
      // Clean up
      await Tool.findByIdAndDelete(tool._id);
    } catch (error) {
      console.log('✗ Tool model test failed:', error.message);
      failed++;
    }
    
    // Test 7: JWT utilities
    console.log('\nTest 7: JWT utilities');
    try {
      const jwt = require('../utils/jwt');
      const token = jwt.generateToken('test_id', 'test_user', ['user']);
      const decoded = jwt.decodeToken(token);
      assert.strictEqual(decoded.user_id, 'test_id');
      assert.strictEqual(decoded.username, 'test_user');
      console.log('✓ JWT utilities working correctly');
      passed++;
    } catch (error) {
      console.log('✗ JWT utilities test failed:', error.message);
      failed++;
    }
    
    // Test 8: Security utilities
    console.log('\nTest 8: Security utilities');
    try {
      const security = require('../utils/security');
      const id = security.generateId();
      assert.strictEqual(id.length, 32);
      console.log('✓ Security utilities working correctly');
      passed++;
    } catch (error) {
      console.log('✗ Security utilities test failed:', error.message);
      failed++;
    }
    
    await db.disconnectDB();
    
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
