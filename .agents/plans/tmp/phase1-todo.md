# Phase 1: Document Parsing Infrastructure - Detailed Todo List

**Phase**: 1 of 6  
**Dependencies**: None (foundation layer)  
**Estimated effort**: ~2-3 days  

---

## Purpose

Replace the broken `fileBuffer.toString('utf8')` approach with proper file type parsers for PDF, DOCX, XLSX, CSV, TXT, and MD. This is the foundation — all other phases depend on correct text extraction from documents.

---

## Task 1.1: Install Parsing Dependencies

- [ ] Add `pdf-parse@^1.1.0` to package.json dependencies
- [ ] Add `mammoth@^1.8.0` to package.json dependencies  
- [ ] Add `xlsx@^0.18.5` to package.json dependencies
- [ ] Run `npm install` and verify all packages install without errors
- [ ] Verify Node 24.12+ compatibility with all three packages

**Acceptance criteria:**
- `npm install` completes without errors or warnings about incompatible engines
- All three modules can be `require()`'d in a test script

---

## Task 1.2: Create DocumentParser Service

**File**: `src/services/documentParser.js`

- [ ] Implement `parsePDF(buffer)`:
  - Use pdf-parse to extract text from all pages
  - Return `{ text: string, totalPages: number }`
  - Handle encryption error → throw `{ type: 'encrypted', message: '...' }`
  
- [ ] Implement `parseDOCX(buffer)`:
  - Use mammoth.extractRawText() 
  - Return `{ text: string }`
  - Preserve paragraph structure (newlines between paragraphs)
  
- [ ] Implement `parseXLSX(buffer)`:
  - Use xlsx.read() to parse workbook
  - Iterate all sheets, convert each to markdown table format
  - Return `{ text: string, sheetNames: string[] }`
  - Each sheet section prefixed with `## SheetName` header
  
- [ ] Implement `parseCSV(buffer)`:
  - Handle quoted fields, commas within fields
  - Convert to structured text: header row as column names, data rows as "col1: val1, col2: val2"
  - Return `{ text: string }`
  
- [ ] Implement `parseTXT(buffer)`:
  - Convert buffer to UTF-8 string
  - Trim excessive whitespace (multiple blank lines → single blank line)
  - Return `{ text: string }`
  
- [ ] Implement `parseMD(buffer)`:
  - Strip markdown formatting (headers, bold, italic, links, code blocks)
  - Keep the semantic text content
  - Return `{ text: string }`
  
- [ ] Implement `parseJSON(buffer)`:
  - Parse JSON buffer to object using `JSON.parse()`
  - Convert structured data to readable text with keys as section headers
  - Handle nested objects by iterating recursively, using dot-notation paths as headers
  - Handle arrays by converting each element to a numbered list entry
  - Return `{ text: string }`
  
- [ ] Implement `parseFile(buffer, fileType)`:
  - Router function that dispatches to correct parser based on fileType
  - Returns `{ text, extras? }` where extras may include sheetNames, totalPages
  
**Acceptance criteria:**
- Each parser correctly extracts text from a sample file of that type
- parseXLSX returns sheetNames array matching actual sheet names in workbook
- parseMD strips all formatting but preserves semantic content
- parseCSV handles fields with commas inside quotes correctly

---

## Task 1.3: Update ragService.uploadDocument()

**File**: `src/services/ragService.js`

- [ ] Import DocumentParser at top of file
- [ ] Replace line 25 (`const fileContent = fileBuffer.toString('utf8')`) with:
  ```javascript
  const { text, sheetNames } = await documentParser.parseFile(fileBuffer, fileExtension);
  ```
- [ ] Add try/catch around parse call to handle parse errors
- [ ] On parse error: set document status to 'failed', save error_message
- [ ] If sheetNames present, store in metadata for later reference

**Acceptance criteria:**
- Uploading a PDF results in extracted text content (not binary garbage)
- Uploading an XLSX extracts all sheet contents with sheet headers
- Encrypted PDF sets status to 'failed' with descriptive error_message
- Plain text files still work as before

---

## Task 1.4: Update ragController.fileFilter

**File**: `src/controllers/ragController.js`

- [ ] Add MIME type for XLSX: `'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`
- [ ] Add MIME type for DOCX (was already partially supported via extension check): `'application/vnd.openxmlformats-officedocument.wordprocessingml.document'`
- [ ] Ensure PDF is in allowedTypes: `'application/pdf'` (already present at line 29)

**Acceptance criteria:**
- File upload with XLSX MIME type passes multer filter
- File upload with DOCX MIME type passes multer filter  
- Unsupported MIME types still rejected with 'Invalid file type' error

---

## Task 1.5: Update RAGDocument Model

**File**: `src/models/RAGDocument.js`

- [ ] Add `sheets` field to schema:
  ```javascript
  sheets: { type: [String], default: [] }
  ```
- [ ] Add `parse_error` field to metadata:
  ```javascript
  // Extend metadata object in schema (line 41)
  parse_error: { type: String, default: null }
  ```
- [ ] Add 'xlsx' to file_type enum (line 17):
  ```
  enum: ['pdf', 'txt', 'doc', 'docx', 'md', 'json', 'csv', 'xlsx']
  ```

**Acceptance criteria:**
- RAGDocument schema validates with all new fields
- sheets field defaults to empty array
- parse_error defaults to null
- file_type accepts 'xlsx' as valid value

---

## Notes for Implementers

- Keep parsers lightweight — no dependency on heavy ML models
- For XLSX, only extract cell values (not formulas or formatting)
- CSV parser should handle UTF-8 encoding and BOM markers
- PDF encryption detection: pdf-parse throws an error with code 'ENCRYPTED'
- Document limitations in docstrings (e.g., "PDF forms are not supported")
