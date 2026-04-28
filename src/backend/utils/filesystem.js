const config = require('../config/database');

const createDirectories = require('fs').mkdirSync;
const path = require('path');

const ensureDirectories = () => {
  const dirs = [
    'logs',
    'uploads/documents',
    'uploads/images',
    'temp'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', '..', dir);
    try {
      createDirectories(fullPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error.message);
    }
  });
};

const getUploadPath = (type = 'documents') => {
  const base = path.join(__dirname, '..', '..');
  return path.join(base, 'uploads', type);
};

const getTempPath = () => {
  return path.join(__dirname, '..', '..', 'temp');
};

const ensureFile = (filePath) => {
  try {
    require('fs').writeFileSync(filePath, '', { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

module.exports = {
  ensureDirectories,
  getUploadPath,
  getTempPath,
  ensureFile
};
