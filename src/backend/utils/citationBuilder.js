const buildCitations = (searchResults) => {
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return { citations: [], citationMap: {} };
  }
  
  const citations = [];
  const citationMap = {};
  
  for (let i = 0; i < searchResults.results.length; i++) {
    const result = searchResults.results[i];
    const citationId = i + 1;
    
    citations.push({
      id: citationId,
      text: result.text,
      source: {
        document_id: result.document_id,
        filename: result.filename,
        file_type: result.file_type,
        chunk_index: result.chunk_index,
        similarity: result.similarity,
        sheet_name: result.sheet_name
      }
    });
    
    citationMap[result.chunk_index] = citationId;
  }
  
  return { citations, citationMap };
};

const formatSourceList = (citations) => {
  if (!citations || citations.length === 0) return '';
  
  const seenDocs = new Map();
  
  for (const citation of citations) {
    if (!seenDocs.has(citation.source.document_id)) {
      seenDocs.set(citation.source.document_id, {
        filename: citation.source.filename,
        file_type: citation.source.file_type,
        max_similarity: citation.source.similarity,
        sheets: citation.source.sheet_name ? [citation.source.sheet_name] : []
      });
    } else {
      const existing = seenDocs.get(citation.source.document_id);
      if (citation.source.similarity > existing.max_similarity) {
        existing.max_similarity = citation.source.similarity;
      }
      if (citation.source.sheet_name && !existing.sheets.includes(citation.source.sheet_name)) {
        existing.sheets.push(citation.source.sheet_name);
      }
    }
  }
  
  let sourceList = '\n\n**Sources:**\n';
  
  for (const [docId, info] of seenDocs) {
    const sheetInfo = info.sheets.length > 0 ? `, sheet: ${info.sheets.join(', ')}` : '';
    sourceList += `${Math.round(info.max_similarity * 100)}% [${info.filename}](${docId}) — chunk${sheetInfo}\n`;
  }
  
  return sourceList;
};

const deterministicInjectCitations = (text, searchResults) => {
  if (!searchResults || !searchResults.results || searchResults.results.length === 0) {
    return text;
  }
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let resultText = text;
  
  for (const sentence of sentences) {
    if (sentence.trim().length < 10) continue;
    
    const bestMatch = findBestMatchingChunk(sentence, searchResults.results);
    
    if (bestMatch && bestMatch.similarity >= 0.3) {
      resultText = resultText.replace(
        sentence.trim(),
        sentence.trim() + ` [${bestMatch.citationId}]`
      );
    }
  }
  
  return resultText;
};

const findBestMatchingChunk = (sentence, results) => {
  if (!results || results.length === 0) return null;
  
  let bestMatch = null;
  let bestSimilarity = 0;
  
  for (const result of results) {
    const similarity = computeTextSimilarity(sentence, result.text);
    
    if (similarity > bestSimilarity && similarity >= 0.3) {
      bestSimilarity = similarity;
      bestMatch = { ...result, citationId: results.indexOf(result) + 1 };
    }
  }
  
  return bestMatch;
};

const computeTextSimilarity = (text1, text2) => {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }
  
  return overlap / Math.max(words1.size, words2.size);
};

module.exports = {
  buildCitations,
  formatSourceList,
  deterministicInjectCitations
};
