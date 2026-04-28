const fs = require('fs');
const path = require('path');

const MAX_OUTPUT_LINES = 2000;
const MAX_OUTPUT_BYTES = 50 * 1024;

function truncateOutput(output) {
  if (!output) return '';

  const lines = output.split('\n');
  const bytes = Buffer.byteLength(output);

  if (lines.length > MAX_OUTPUT_LINES) {
    const truncated = lines.slice(0, MAX_OUTPUT_LINES).join('\n');
    return (
      truncated +
      `\n...${lines.length - MAX_OUTPUT_LINES} lines truncated...\nFull output may be available in session context.`
    );
  }

  if (bytes > MAX_OUTPUT_BYTES) {
    let truncated = output;
    let currentBytes = 0;
    const linesArr = output.split('\n');
    const result = [];

    for (const line of linesArr) {
      const lineBytes = Buffer.byteLength(line);
      if (currentBytes + lineBytes > MAX_OUTPUT_BYTES) break;
      result.push(line);
      currentBytes += lineBytes + 1;
    }

    truncated = result.join('\n');
    return (
      truncated +
      `\n...output truncated (${bytes} bytes)...\nFull output may be available in session context.`
    );
  }

  return output;
}

function saveToTemp(output) {
  const cacheDir = path.join(process.cwd(), 'src', 'backend', 'uploads', 'tools');

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const timestamp = Date.now();
  const filePath = path.join(cacheDir, `tool_${timestamp}.txt`);
  fs.writeFileSync(filePath, output, 'utf-8');

  return filePath;
}

module.exports = {
  truncateOutput,
  saveToTemp,
  MAX_OUTPUT_LINES,
  MAX_OUTPUT_BYTES,
};
