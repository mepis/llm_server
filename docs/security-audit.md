# Security Audit Report

**Date**: 2026-04-26  
**Repository**: LLM Server (llm_server)  
**Auditor**: Automated Security Analysis  

---

## Executive Summary

This report documents the findings of a security audit performed on the LLM Server codebase. The audit focused on identifying vulnerabilities in authentication, authorization, injection risks, and dynamic code execution.

**Overall Risk Rating**: **HIGH**

The application contains one critical vulnerability (Remote Code Execution), one high-severity vulnerability (Command Injection), and several medium-severity issues that could be exploited by an attacker with varying levels of access.

---

## Vulnerability Findings

### 1. Remote Code Execution (RCE) via Custom Tool Code Execution

**Severity**: **CRITICAL**  
**CVSS Estimate**: 9.8/10  
**Location**: `src/services/toolService.js` (lines 165-176), `src/tool/registry.js` (lines 72-89)

#### Description
The system allows administrators to create and update "custom tools" that contain arbitrary JavaScript code stored in the database. This code is executed dynamically using `new AsyncFunction`:

```javascript
// src/services/toolService.js:167-174
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const fn = new AsyncFunction('params', fnBody);
const result = await fn(validatedArgs);
```

```javascript
// src/tool/registry.js:74-76
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const fn = new AsyncFunction('params', tool.code);
const result = await fn(args);
```

#### Attack Vector
1. An attacker gains access to an `admin` account (via credential stuffing, phishing, or other means).
2. The attacker creates a custom tool with malicious JavaScript code, such as:
   ```javascript
   const fs = require('fs');
   fs.writeFileSync('/tmp/pwned', 'compromised');
   // Or worse: exfiltrate data, install backdoors, etc.
   ```
3. When the tool is executed (either via the API or through the LLM's tool use), the malicious code runs with the same privileges as the Node.js server process.

Alternatively, if the attacker can influence the content of a custom tool (e.g., by convincing an admin to import a crafted tool), they can achieve RCE without direct admin access.

#### Impact
- **Full system compromise**: The attacker can execute arbitrary commands on the server.
- **Data exfiltration**: Access to all data in MariaDB, Qdrant, and the file system.
- **Persistence**: The attacker can install backdoors or modify application code.

#### Remediation
1. **Immediate**: Disable custom tool creation by removing the `POST /api/tools/` and `PUT /api/tools/:id` endpoints until a secure implementation is available.
2. **Short-term**: Implement a sandboxed execution environment using:
   - `vm2` or `isolated-vm` for JavaScript sandboxing.
   - Running tool execution in a separate process with restricted permissions (e.g., Docker container, chroot).
3. **Long-term**: Design a tool system that uses declarative configurations instead of arbitrary code execution.

---

### 2. Command Injection in Bash Tool

**Severity**: **HIGH**  
**CVSS Estimate**: 8.6/10  
**Location**: `src/tool/bash.js` (lines 6-23), `src/workers/worker.js` (lines 41-46)

#### Description
The `bash` tool attempts to prevent command injection by blocking common shell operators:

```javascript
// src/tool/bash.js:6-12
const DANGEROUS_PATTERNS = [
  { regex: /;/, desc: 'command chaining with semicolons' },
  { regex: /&&/, desc: 'AND command chaining' },
  { regex: /\|\|/, desc: 'OR command chaining' },
  { regex: /`/, desc: 'backtick command substitution' },
  { regex: /\$\(/, desc: 'parenthesized command substitution' },
];
```

However, the implementation has several bypasses:

1. **Newline characters (`\n`, `\r`)**: Not blocked, allowing command chaining:
   ```
   echo hello\nls -la /etc
   ```

2. **Background operator (`&`)**: Not blocked, allowing parallel execution:
   ```
   echo hello & rm -rf /tmp/important
   ```

3. **Shell redirections (`>`, `>>`, `<`)**: Not blocked, though the error message claims they are allowed:
   ```javascript
   // src/tool/bash.js:21
   throw new Error(`... Use pipes (|), redirects (>), and simple commands only.`);
   ```

4. **Environment variable expansion**: Not blocked:
   ```
   echo $HOME
   ```

5. **Process substitution (`<(...)`, `>(...)`)**: Not blocked.

The worker executes commands using `shell: true`:

```javascript
// src/workers/worker.js:41-46
const process = spawn(command, {
  shell: true,
  cwd: workdir || process.cwd(),
  timeout: effectiveTimeout,
  env: { ...sanitizedEnv, cwd: workdir || process.cwd() },
});
```

#### Attack Vector
1. An authenticated user (with access to the `bash` tool) submits a malicious command that bypasses the sanitization.
2. The LLM assistant executes the command via tool use.

#### Impact
- **Arbitrary command execution**: The attacker can run any shell command.
- **Data access**: Read sensitive files, exfiltrate data.
- **Lateral movement**: Use the server as a pivot point for further attacks.

#### Remediation
1. **Immediate**: Replace regex-based sanitization with a allowlist approach or use a more robust command parsing library.
2. **Short-term**: Block additional dangerous patterns:
   ```javascript
   const DANGEROUS_PATTERNS = [
     // ... existing patterns ...
     { regex: /\n/, desc: 'newline character' },
     { regex: /\r/, desc: 'carriage return' },
     { regex: /&/, desc: 'background operator' },
     { regex: />/, desc: 'output redirection' },
     { regex: /</, desc: 'input redirection' },
     { regex: /\$/, desc: 'variable expansion' },
   ];
   ```
3. **Long-term**: Avoid `shell: true` and execute commands as arrays of arguments:
   ```javascript
   const [cmd, ...args] = command.split(/\s+/);
   const process = spawn(cmd, args, { cwd: workdir });
   ```

---

### 3. Potential SQL Injection in Unused Code

**Severity**: **MEDIUM**  
**CVSS Estimate**: 5.5/10  
**Location**: `src/services/logService.js` (lines 6-8)

#### Description
The `jsonContains` helper function uses raw SQL with parameterized column names, which is a dangerous pattern:

```javascript
// src/services/logService.js:6-8
const jsonContains = (column, value) => ({
  jsonContains: [knex().raw(`?`, [column]), JSON.stringify(value)],
});
```

While `knex().raw('?', [column])` attempts to parameterize the column name, this is not safe in SQL. Column names cannot be parameterized in prepared statements, and this pattern could lead to SQL injection if `column` is ever user-controlled.

**Note**: This function is currently unused (no calls to `jsonContains()` were found in the codebase), but it represents a risky pattern that could be introduced in future development.

#### Attack Vector
If this function is used with user-supplied input for the `column` parameter:
```javascript
// Hypothetical vulnerable usage
const userInput = req.query.column; // e.g., "user_id; DROP TABLE users--"
jsonContains(userInput, value);
```

This could lead to SQL injection, allowing an attacker to read, modify, or delete database records.

#### Impact
- **Data manipulation**: Read, modify, or delete arbitrary database records.
- **Denial of Service**: Drop tables or corrupt the database schema.

#### Remediation
1. **Immediate**: Remove or disable the `jsonContains` function until a safe implementation is available.
2. **Short-term**: Never use user input for column names in raw SQL queries. Use an allowlist of valid column names:
   ```javascript
   const VALID_COLUMNS = ['metadata', 'some_other_column'];
   if (!VALID_COLUMNS.includes(column)) {
     throw new Error('Invalid column name');
   }
   ```
3. **Long-term**: Use Knex's built-in methods for JSON queries where possible.

---

### 4. User Enumeration via Authentication Errors

**Severity**: **MEDIUM**  
**CVSS Estimate**: 3.7/10  
**Location**: `src/controllers/userController.js` (lines 29-37, 4-12)

#### Description
The registration and login endpoints return different error messages based on whether the username/email exists:

```javascript
// src/controllers/userController.js:4-12
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await userService.registerUser(username, email, password);
    // ...
  } catch (error) {
    logger.error('Register failed:', error.message);
    res.status(error.message.includes('already exists') ? 409 : 400)
       .json({ success: false, error: error.message });
  }
};

// src/controllers/userController.js:29-37
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await userService.loginUser(username, password);
    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Login failed:', error.message);
    res.status(401).json({ success: false, error: error.message });
  }
};
```

In `userService.js`:
```javascript
// src/services/userService.js:30-32
if (existingUser) {
  throw new Error('Username or email already exists');
}

// src/services/userService.js:104-107
if (!user) {
  throw new Error('Invalid credentials');
}
```

#### Attack Vector
An attacker can register or login with different usernames/emails and observe the error responses to determine which ones are already in use.

#### Impact
- **User enumeration**: Attackers can identify valid usernames/emails for targeted attacks (phishing, credential stuffing).
- **Information disclosure**: Reveals the application's user base.

#### Remediation
Use generic error messages that don't reveal whether a username/email exists:

```javascript
// For registration
res.status(409).json({ success: false, error: 'Registration failed' });

// For login
res.status(401).json({ success: false, error: 'Invalid credentials' });
```

---

### 5. Sensitive Data Exposure in Configuration Settings API

**Severity**: **MEDIUM**  
**CVSS Estimate**: 5.3/10  
**Location**: `src/controllers/configController.js` (lines 82-104)

#### Description
The `resetToEnvDefaults` endpoint exposes sensitive configuration values, including the JWT secret:

```javascript
// src/controllers/configController.js:82-104
const getEnvConfig = () => {
  const entries = [
    // ...
    { key: 'JWT_SECRET', value: config.jwt.secret, category: 'auth' },
    // ...
  ];
  return entries;
};
```

Additionally, the `MARIADB_URI` includes database credentials:
```javascript
{ key: 'MARIADB_URI', value: `mysql2://${config.db?.host || 'localhost'}:${config.db?.port || 3306}/${config.db?.database || 'llm_server'}`, category: 'database' },
```

#### Attack Vector
A user with `admin` role can access the `/api/config/` endpoint and retrieve sensitive configuration values.

#### Impact
- **JWT secret exposure**: Allows attackers to forge valid JWT tokens.
- **Database credentials exposure**: Allows direct database access.

#### Remediation
1. Mask or redact sensitive values in API responses:
   ```javascript
   { key: 'JWT_SECRET', value: '***REDACTED***', category: 'auth' },
   ```
2. Use a separate, more restricted endpoint for administration of sensitive configuration.

---

## Secure Coding Recommendations

### 1. Input Validation
- Use a comprehensive input validation library (e.g., Zod) for all user inputs.
- Implement allowlist-based validation for critical inputs (file paths, command names).

### 2. Output Encoding
- Encode all user-supplied data before rendering in the frontend to prevent XSS.
- Sanitize HTML/content before storing in the database.

### 3. Security Headers
- Add security headers to all HTTP responses:
  ```javascript
  app.use(helmet()); // npm install helmet
  ```

### 4. Rate Limiting
- Implement rate limiting on authentication endpoints to prevent brute-force attacks.
- Consider adding CAPTCHA after multiple failed login attempts.

### 5. Logging and Monitoring
- Log all security-relevant events (failed logins, tool executions, admin actions).
- Set up alerts for suspicious activity patterns.

### 6. Dependency Updates
- Regularly update dependencies to patch known vulnerabilities:
  ```bash
  npm audit
  npm update
  ```

---

## Conclusion

The LLM Server application has several critical and high-severity vulnerabilities that require immediate attention. The most pressing issues are the Remote Code Execution via custom tools and Command Injection in the bash tool. These vulnerabilities could allow an attacker to gain full control of the server.

**Recommended Priority Order for Remediation**:
1. Disable or sandbox custom tool execution (CRITICAL).
2. Fix command injection in bash tool (HIGH).
3. Remove or fix potential SQL injection pattern (MEDIUM).
4. Implement generic auth error messages (MEDIUM).
5. Mask sensitive configuration values in API responses (MEDIUM).

---

## Appendix: Affected Files

| File | Line(s) | Vulnerability |
|------|---------|---------------|
| `src/services/toolService.js` | 165-176 | RCE via AsyncFunction |
| `src/tool/registry.js` | 72-89 | RCE via AsyncFunction |
| `src/tool/bash.js` | 6-23 | Command Injection (incomplete sanitization) |
| `src/workers/worker.js` | 41-46 | Command Execution with shell: true |
| `src/services/logService.js` | 6-8 | Potential SQL Injection (unused) |
| `src/controllers/userController.js` | 29-37, 4-12 | User Enumeration |
| `src/controllers/configController.js` | 82-104 | Sensitive Data Exposure |

---

**End of Report**
