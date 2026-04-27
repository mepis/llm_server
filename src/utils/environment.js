const requiredEnvVars = [
  { name: 'MARIADB_HOST', description: 'MariaDB host address' },
  { name: 'JWT_SECRET', description: 'Secret key for JWT token generation' }
];

const optionalEnvVars = [
  { name: 'PORT', default: '3000', description: 'Server port' },
  { name: 'NODE_ENV', default: 'development', description: 'Environment (development|production)' },
  { name: 'MARIADB_PORT', default: '3306', description: 'MariaDB port' },
  { name: 'MARIADB_USER', default: 'root', description: 'MariaDB username' },
  { name: 'MARIADB_PASSWORD', default: '', description: 'MariaDB password' },
  { name: 'MARIADB_DATABASE', default: 'llm_server', description: 'MariaDB database name' },
  { name: 'QDRANT_GRPC_HOST', default: 'localhost', description: 'Qdrant gRPC host' },
  { name: 'QDRANT_GRPC_PORT', default: '6334', description: 'Qdrant gRPC port' },
  { name: 'JWT_EXPIRES_IN', default: '7d', description: 'JWT token expiration time' },
  { name: 'LLAMA_SERVER_URL', default: 'http://localhost:8082', description: 'Llama.cpp server URL' },
  { name: 'LLAMA_TIMEOUT', default: '30000', description: 'Llama server request timeout (ms)' },
  { name: 'CORS_ALLOWED_ORIGINS', default: '', description: 'Comma-separated list of allowed CORS origins' },
  { name: 'FRONTEND_URL', default: 'http://localhost:5173', description: 'Frontend URL' },
  { name: 'MATRIX_HOMESERVER', description: 'Matrix homeserver URL' },
  { name: 'MATRIX_ACCESS_TOKEN', description: 'Matrix access token' },
  { name: 'MATRIX_USER_ID', description: 'Matrix user ID' },
  { name: 'LOG_LEVEL', default: 'info', description: 'Logging level' },
  { name: 'SESSION_TIMEOUT', default: '86400000', description: 'Session timeout (ms)' },
  { name: 'MAX_FILE_SIZE', default: '10485760', description: 'Max file upload size (bytes)' }
];

function validateEnvironment() {
  const missingVars = [];
  const warnings = [];

  requiredEnvVars.forEach(({ name, description }) => {
    if (!process.env[name]) {
      missingVars.push(`  - ${name}: ${description}`);
    }
  });

  optionalEnvVars.forEach(({ name, default: defaultValue, description }) => {
    if (!process.env[name] && defaultValue) {
      warnings.push(`  - ${name}: Using default value "${defaultValue}" (${description})`);
    } else if (!process.env[name]) {
      warnings.push(`  - ${name}: Not set (${description})`);
    }
  });

  if (missingVars.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', 'Missing required environment variables:');
    missingVars.forEach(msg => console.error('\x1b[31m%s\x1b[0m', msg));
    console.error('\nPlease set these variables in your .env file and restart the server.\n');
    process.exit(1);
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.log('\x1b[33m%s\x1b[0m', 'Environment variable warnings:');
    warnings.forEach(msg => console.log('\x1b[33m%s\x1b[0m', msg));
    console.log('');
  }

  return { valid: true };
}

module.exports = {
  validateEnvironment,
  requiredEnvVars,
  optionalEnvVars
};
