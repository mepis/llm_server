const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

const parsePDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text.trim(),
      totalPages: data.numpages || 0
    };
  } catch (error) {
    if (error.code === 'ENCRYPTED') {
      throw { type: 'encrypted', message: 'PDF is password-protected and cannot be parsed' };
    }
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

const parseDOCX = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value.trim() || ''
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error.message}`);
  }
};

const parseXLSX = async (buffer) => {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    let textParts = [];
    
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const markdownTable = convertSheetToMarkdown(worksheet);
      textParts.push(`## ${sheetName}\n${markdownTable}`);
    }
    
    return {
      text: textParts.join('\n\n'),
      sheetNames: sheetNames
    };
  } catch (error) {
    throw new Error(`Failed to parse XLSX: ${error.message}`);
  }
};

const convertSheetToMarkdown = (worksheet) => {
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (rows.length === 0) return '';
  
  let markdown = '|';
  
  for (let i = 0; i < rows[0].length; i++) {
    const header = rows[0][i] !== undefined ? String(rows[0][i]) : '';
    markdown += ` ${header} |`;
  }
  markdown += '\n|';
  
  for (let i = 0; i < rows[0].length; i++) {
    markdown += ' --- |';
  }
  markdown += '\n';
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    markdown += '|';
    for (let j = 0; j < rows[0].length; j++) {
      const cell = row[j] !== undefined ? String(row[j]) : '';
      markdown += ` ${cell} |`;
    }
    markdown += '\n';
  }
  
  return markdown.trim();
};

const parseCSV = async (buffer) => {
  try {
    const text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length === 0) return { text: '' };
    
    const headers = parseCSVLine(lines[0]);
    let resultParts = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;
      
      let entryParts = [];
      for (let j = 0; j < headers.length; j++) {
        const value = j < values.length ? values[j] : '';
        entryParts.push(`${headers[j]}: ${value}`);
      }
      resultParts.push(entryParts.join(', '));
    }
    
    return {
      text: resultParts.join('\n')
    };
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
};

const parseCSVLine = (line) => {
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  
  fields.push(current.trim());
  return fields;
};

const parseTXT = async (buffer) => {
  try {
    let text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    text = text.replace(/(\n\s*\n){3,}/g, '\n\n\n');
    return {
      text: text.trim()
    };
  } catch (error) {
    throw new Error(`Failed to parse TXT: ${error.message}`);
  }
};

const parseMD = async (buffer) => {
  try {
    let text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    
    text = text.replace(/^#{1,6}\s+(.*$)/gm, '$1');
    text = text.replace(/\*\*(.*?)\*\*/g, '$1');
    text = text.replace(/\*(.*?)\*/g, '$1');
    text = text.replace(/__(.*?)__/g, '$1');
    text = text.replace(/_(.*?)_/g, '$1');
    text = text.replace(/`(.*?)`/g, '$1');
    text = text.replace(/~~(.*?)~~/g, '$1');
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    text = text.replace(/^>\s+(.*$)/gm, '$1');
    text = text.replace(/^-{3,}$/gm, '');
    text = text.replace(/^\* /gm, '');
    text = text.replace(/^\d+\. /gm, '');
    
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return {
      text: text.trim()
    };
  } catch (error) {
    throw new Error(`Failed to parse MD: ${error.message}`);
  }
};

const parseJSON = async (buffer) => {
  try {
    const text = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const data = JSON.parse(text);
    
    return {
      text: convertJSONToText(data, '')
    };
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
};

const convertJSONToText = (data, prefix) => {
  if (data === null || data === undefined) return `${prefix}: null`;
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }
  
  if (Array.isArray(data)) {
    let result = '';
    if (prefix) result += `${prefix}:\n`;
    data.forEach((item, index) => {
      const itemPrefix = prefix ? `${prefix}[${index}]` : `[${index}]`;
      result += convertJSONToText(item, itemPrefix);
      if (index < data.length - 1) result += '\n';
    });
    return result;
  }
  
  if (typeof data === 'object') {
    let result = '';
    const keys = Object.keys(data);
    
    if (prefix) {
      result += `${prefix}:\n`;
    }
    
    for (const key of keys) {
      const value = data[key];
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        result += convertJSONToText(value, newPrefix);
      } else {
        result += `${newPrefix}: ${value}\n`;
      }
    }
    
    return result.trim();
  }
  
  return String(data);
};

const parseFile = async (buffer, fileType) => {
  const normalizedType = (fileType || '').toLowerCase().trim();
  
  switch (normalizedType) {
    case 'pdf':
      return parsePDF(buffer);
    case 'docx':
      return parseDOCX(buffer);
    case 'xlsx':
      return parseXLSX(buffer);
    case 'csv':
      return parseCSV(buffer);
    case 'txt':
    case 'text':
      return parseTXT(buffer);
    case 'md':
    case 'markdown':
      return parseMD(buffer);
    case 'json':
      return parseJSON(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

module.exports = {
  parsePDF,
  parseDOCX,
  parseXLSX,
  parseCSV,
  parseTXT,
  parseMD,
  parseJSON,
  parseFile
};
