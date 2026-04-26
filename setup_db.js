const { setupDatabase } = require('./src/utils/database');
const { connectDB, disconnectDB } = require('./src/config/db');

(async () => {
  try {
    await connectDB();
    await setupDatabase();
    console.log('Setup complete');
    await disconnectDB();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
