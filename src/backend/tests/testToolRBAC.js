const http = require('http');

const BASE_URL = 'http://localhost:3000/api';
const results = [];
let tokens = {};

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login(username, password) {
  const res = await request('POST', '/api/auth/login', { username, password });
  if (res.status !== 200) throw new Error(`Login failed for ${username}: ${res.status} - ${JSON.stringify(res.body)}`);
  return res.body.data.token;
}

async function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    results.push({ pass: true, message });
  } else {
    console.log(`  ✗ ${message}`);
    results.push({ pass: false, message });
  }
}

async function assertStatus(res, expected, message) {
  await assert(res.status === expected, `${message} (expected ${expected}, got ${res.status})`);
}

async function assertSuccess(res, message) {
  await assert(res.body.success === true, `${message} (success=${res.body.success})`);
}

async function assertError(res, message) {
  await assert(res.body.success === false, `${message} (success=${res.body.success})`);
}

async function runTests() {
  console.log('=== RBAC Tool Integration Tests ===\n');

  // Login as admin
  console.log('1. Logging in as admin...');
  tokens.admin = await login('admin', 'admin123');
  console.log('  ✓ Admin logged in\n');

  // Login as regular user
  console.log('2. Logging in as regular user...');
  try {
    tokens.user = await login('test_user', 'password123');
  } catch (e) {
    console.log('  Creating test user...');
    const createUserRes = await request('POST', '/api/auth/register', {
      username: 'test_user',
      email: 'test_user@example.com',
      password: 'password123',
    });
    if (createUserRes.status === 201 || createUserRes.body.success) {
      tokens.user = await login('test_user', 'password123');
      console.log('  ✓ Test user created and logged in\n');
    } else {
      console.log('  ✗ Failed to create test user');
      return;
    }
  }

  // Test 1: Admin can create a tool
  console.log('3. Admin creates a tool (roles: [user, admin])...');
  const createRes = await request('POST', '/api/tools', {
    name: 'Test Tool',
    description: 'A test tool for RBAC',
    function_code: 'async function(params) { return params; }',
    parameters: [{ name: 'input', type: 'string', required: true, description: 'Input value' }],
    roles: ['user', 'admin'],
  }, tokens.admin);
  await assertStatus(createRes, 201, 'Admin can create tool');
  await assertSuccess(createRes, 'Create returns success');
  const toolId = createRes.body.data._id;
  const toolRoles = createRes.body.data.roles;
  await assert(toolRoles.includes('user') && toolRoles.includes('admin'), 'Tool has correct roles');
  console.log();

  // Test 2: Regular user cannot create a tool
  console.log('4. Regular user attempts to create a tool...');
  const userCreateRes = await request('POST', '/api/tools', {
    name: 'User Tool',
    description: 'User tries to create',
    function_code: 'async function() {}',
    parameters: [],
  }, tokens.user);
  await assertStatus(userCreateRes, 403, 'Regular user cannot create tool (403)');
  console.log();

  // Test 3: Admin can list all tools
  console.log('5. Admin lists all tools...');
  const adminListRes = await request('GET', '/api/tools', null, tokens.admin);
  await assertStatus(adminListRes, 200, 'Admin can list tools');
  await assertSuccess(adminListRes, 'Admin list returns success');
  await assert(adminListRes.body.data.length >= 1, `Admin sees ${adminListRes.body.data.length} tools`);
  console.log();

  // Test 4: Regular user can list tools (only those matching their roles)
  console.log('6. Regular user lists tools...');
  const userListRes = await request('GET', '/api/tools', null, tokens.user);
  await assertStatus(userListRes, 200, 'Regular user can list tools');
  await assertSuccess(userListRes, 'User list returns success');
  await assert(userListRes.body.data.length >= 1, `User sees ${userListRes.body.data.length} tools`);
  console.log();

  // Test 5: Admin can get any tool
  console.log('7. Admin gets the test tool...');
  const adminGetRes = await request('GET', `/api/tools/${toolId}`, null, tokens.admin);
  await assertStatus(adminGetRes, 200, 'Admin can get tool');
  await assertSuccess(adminGetRes, 'Admin get returns success');
  console.log();

  // Test 6: Regular user can get tool matching their roles
  console.log('8. Regular user gets the test tool (roles include user)...');
  const userGetRes = await request('GET', `/api/tools/${toolId}`, null, tokens.user);
  await assertStatus(userGetRes, 200, 'Regular user can get tool with matching role');
  await assertSuccess(userGetRes, 'User get returns success');
  console.log();

  // Test 7: Admin can update any tool
  console.log('9. Admin updates the test tool...');
  const adminUpdateRes = await request('PUT', `/api/tools/${toolId}`, {
    name: 'Updated Tool',
    description: 'Updated description',
    roles: ['admin'],
  }, tokens.admin);
  await assertStatus(adminUpdateRes, 200, 'Admin can update tool');
  await assertSuccess(adminUpdateRes, 'Admin update returns success');
  await assert(adminUpdateRes.body.data.roles.includes('admin'), 'Admin update can change roles');
  console.log();

  // Test 8: Regular user cannot update a tool
  console.log('10. Regular user attempts to update the tool...');
  const userUpdateRes = await request('PUT', `/api/tools/${toolId}`, {
    name: 'Hacked Tool',
  }, tokens.user);
  await assertStatus(userUpdateRes, 403, 'Regular user cannot update tool (403)');
  console.log();

  // Test 9: Regular user cannot delete a tool
  console.log('11. Regular user attempts to delete the tool...');
  const userDeleteRes = await request('DELETE', `/api/tools/${toolId}`, null, tokens.user);
  await assertStatus(userDeleteRes, 403, 'Regular user cannot delete tool (403)');
  console.log();

  // Test 10: Admin can delete a tool
  console.log('12. Admin deletes the test tool...');
  const adminDeleteRes = await request('DELETE', `/api/tools/${toolId}`, null, tokens.admin);
  await assertStatus(adminDeleteRes, 200, 'Admin can delete tool');
  await assert(adminDeleteRes.body.success === true, 'Admin delete returns success');
  console.log();

  // Test 11: Create a user-only tool and test access
  console.log('13. Creating a user-only tool for access testing...');
  const userToolRes = await request('POST', '/api/tools', {
    name: 'User Only Tool',
    description: 'Only accessible by users',
    function_code: 'async function(params) { return { result: params.input }; }',
    parameters: [{ name: 'input', type: 'string', required: true, description: 'Input' }],
    roles: ['user'],
  }, tokens.admin);
  await assertStatus(userToolRes, 201, 'Admin can create user-only tool');
  const userToolId = userToolRes.body.data._id;
  console.log();

  // Test 12: Regular user can execute a tool matching their roles
  console.log('14. Regular user executes a tool with user role...');
  const userExecRes = await request('POST', `/api/tools/call/${userToolId}`, { input: 'hello' }, tokens.user);
  await assertStatus(userExecRes, 200, 'Regular user can execute tool with matching role');
  await assertSuccess(userExecRes, 'User execute returns success');
  await assert(userExecRes.body.data.output.includes('hello'), 'Execute returns correct output');
  console.log();

  // Test 13: Create an admin-only tool
  console.log('15. Creating an admin-only tool...');
  const adminToolRes = await request('POST', '/api/tools', {
    name: 'Admin Only Tool',
    description: 'Only accessible by admins',
    function_code: 'async function() { return { admin: true }; }',
    parameters: [],
    roles: ['admin'],
  }, tokens.admin);
  await assertStatus(adminToolRes, 201, 'Admin can create admin-only tool');
  const adminToolId = adminToolRes.body.data._id;
  console.log();

  // Test 14: Regular user cannot execute admin-only tool
  console.log('16. Regular user attempts to execute admin-only tool...');
  const userAdminExecRes = await request('POST', `/api/tools/call/${adminToolId}`, {}, tokens.user);
  await assert(userAdminExecRes.status === 404 || userAdminExecRes.status === 403, 'Regular user cannot execute admin-only tool');
  await assert(userAdminExecRes.body.success === false, 'Admin-only tool access denied for user');
  console.log();

  // Test 15: Admin can execute admin-only tool
  console.log('17. Admin executes admin-only tool...');
  const adminAdminExecRes = await request('POST', `/api/tools/call/${adminToolId}`, {}, tokens.admin);
  await assertStatus(adminAdminExecRes, 200, 'Admin can execute admin-only tool');
  await assertSuccess(adminAdminExecRes, 'Admin execute returns success');
  console.log();

  // Summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('===================\n');

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.message}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
