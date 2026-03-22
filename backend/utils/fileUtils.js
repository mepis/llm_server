const fs = require('fs').promises;
const path = require('path');

class FileUtils {
  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
      return false;
    }
  }

  async readFile(filePath, encoding = 'utf-8') {
    const content = await fs.readFile(filePath, encoding);
    return content;
  }

  async writeFile(filePath, content, encoding = 'utf-8') {
    const dir = path.dirname(filePath);
    await this.ensureDirectory(dir);
    await fs.writeFile(filePath, content, encoding);
    return filePath;
  }

  async chmod(filePath, mode) {
    await fs.chmod(filePath, mode);
    return filePath;
  }

  async unlink(filePath) {
    await fs.unlink(filePath);
    return true;
  }

  async stat(filePath) {
    return await fs.stat(filePath);
  }

  async readdir(dirPath) {
    return await fs.readdir(dirPath);
  }

  async copyFile(src, dest) {
    await fs.copyFile(src, dest);
    return dest;
  }

  async moveFile(src, dest) {
    await fs.rename(src, dest);
    return dest;
  }
}

module.exports = new FileUtils();
