tags: [rag, parsing, documents, file-processing]
role: backend-developer

# Document Parser Functions

Documented from `src/services/documentParser.js`. The document parser handles extraction of text content from various file formats for RAG (Retrieval-Augmented Generation) indexing.

## Supported File Formats & Functions

- [parsePDF](./document-parser/parsePDF.md) - Extract text from PDF.
- [parseDOCX](./document-parser/parseDOCX.md) - Extract text from Word documents.
- [parseXLSX](./document-parser/parseXLSX.md) - Extract text from Excel (as Markdown tables).
- [parseCSV](./document-parser/parseCSV.md) - Extract text from CSV (key-value format).
- [parseTXT](./document-parser/parseTXT.md) - Extract raw text with normalization.
- [parseMD](./document-parser/parseMD.md) - Extract plain text from Markdown.
- [parseJSON](./document-parser/parseJSON.md) - Convert JSON to plain text representation.
- [parseFile](./document-parser/parseFile.md) - Router for all file parsing.

---
[Back to Index](../index.md)
