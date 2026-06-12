import MiniSearch from 'minisearch';

/**
 * Helper to split a section's text into sub-chunks of maxWords with overlap.
 */
function chunkTextByWords(title, text, maxWords = 500, overlap = 100) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return [{ title, text }];
  }
  const subChunks = [];
  let start = 0;
  let partNum = 1;
  while (start < words.length) {
    let end = start + maxWords;
    // If the remaining words after this chunk would be less than 50 words, just extend this chunk to include them
    if (words.length - end < 50) {
      end = words.length;
    }
    const chunkWords = words.slice(start, end);
    subChunks.push({
      title: `${title} (${partNum})`,
      text: chunkWords.join(' ')
    });
    if (end === words.length) {
      break;
    }
    start += (maxWords - overlap);
    partNum++;
  }
  return subChunks;
}

/**
 * Splits raw Markdown content into logical sections based on headers.
 * Applies max chunk size (500 words) with 100-word overlap and min chunk size (50 words).
 * 
 * @param {string} markdown - The document text in Markdown format.
 * @returns {Array<{ title: string, text: string }>} Chunks array.
 */
export function splitMarkdownIntoChunks(markdown) {
  if (typeof markdown !== 'string') {
    console.warn('splitMarkdownIntoChunks: expected string but received', markdown);
    return [];
  }
  const lines = markdown.split('\n');
  const rawBlocks = [];
  let currentHeader = 'General Information';
  let currentContent = [];

  for (const line of lines) {
    // Check for markdown headers (e.g., # Header, ## Subheader)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const contentText = currentContent.join('\n').trim();
      if (contentText.length > 0) {
        rawBlocks.push({
          title: currentHeader,
          text: contentText
        });
      }
      currentHeader = headerMatch[2].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Push the final chunk
  const contentText = currentContent.join('\n').trim();
  if (contentText.length > 0) {
    rawBlocks.push({
      title: currentHeader,
      text: contentText
    });
  }

  // Fallback if no headers were found
  if (rawBlocks.length === 0 && markdown.trim().length > 0) {
    rawBlocks.push({
      title: 'Document Content',
      text: markdown.trim()
    });
  }

  // Merge small blocks (< 50 words) with next or previous blocks
  const mergedBlocks = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];
    const wordCount = block.text.split(/\s+/).filter(Boolean).length;
    
    if (wordCount < 50 && block.title === 'General Information') {
      if (i + 1 < rawBlocks.length) {
        // Prepend to next block
        rawBlocks[i + 1].text = block.text + "\n\n" + rawBlocks[i + 1].text;
      } else if (mergedBlocks.length > 0) {
        // Append to previous block
        const prevBlock = mergedBlocks[mergedBlocks.length - 1];
        prevBlock.text = prevBlock.text + "\n\n" + block.text;
      } else {
        // Only block in document, keep it
        mergedBlocks.push(block);
      }
    } else {
      mergedBlocks.push(block);
    }
  }

  // Split large blocks (> 500 words) using sliding window
  const finalChunks = [];
  for (const block of mergedBlocks) {
    const subChunks = chunkTextByWords(block.title, block.text, 500, 100);
    finalChunks.push(...subChunks);
  }

  return finalChunks;
}

/**
 * Builds a serializable MiniSearch index from document chunks.
 * 
 * @param {Array<{ title: string, text: string }>} chunks - Array of document chunks.
 * @returns {object} { indexJson: string, chunksJson: string }
 */
export function buildSearchIndex(chunks) {
  if (!Array.isArray(chunks)) {
    console.warn('buildSearchIndex: expected array but received', chunks);
    return { indexJson: '{}', chunksJson: '[]' };
  }
  const miniSearch = new MiniSearch({
    fields: ['title', 'text'],   // Index both the section heading and text body
    storeFields: ['title', 'text'], // Store fields to retrieve them in search results
    searchOptions: {
      prefix: true,
      fuzzy: 0.2, // Allow minor typos (fuzzy matching)
    }
  });

  // Assign IDs to each chunk for indexing
  const documents = chunks.map((chunk, index) => ({
    id: index.toString(),
    title: chunk?.title || '',
    text: chunk?.text || ''
  }));

  miniSearch.addAll(documents);

  return {
    indexJson: JSON.stringify(miniSearch.toJSON()),
    chunksJson: JSON.stringify(chunks)
  };
}

/**
 * Helper to expand query terms with synonyms
 */
function expandQuery(query) {
  const synonyms = {
    'vacation': ['leave', 'time-off', 'pto', 'holiday'],
    'leave': ['vacation', 'time-off', 'pto', 'holiday'],
    'pto': ['vacation', 'leave', 'time-off', 'holiday'],
    'timeoff': ['vacation', 'leave', 'pto', 'holiday'],
    'time-off': ['vacation', 'leave', 'pto', 'holiday'],
    'sick': ['medical', 'illness', 'health', 'leave'],
    'remote': ['work-from-home', 'wfh', 'telecommute', 'hybrid'],
    'wfh': ['remote', 'work-from-home', 'telecommute', 'hybrid'],
    'fired': ['terminated', 'termination', 'dismissal'],
    'salary': ['pay', 'compensation', 'wage'],
    'late': ['tardy', 'punctuality', 'attendance'],
  };
  
  let normalizedQuery = query.toLowerCase().replace(/\btime\s+off\b/g, 'time-off');
  const words = normalizedQuery.split(/\s+/);
  const expandedWords = [];
  
  for (const word of words) {
    // strip punctuation
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if (synonyms[cleanWord]) {
      // Repeat the key domain word 5 times to boost its weight
      for (let k = 0; k < 5; k++) {
        expandedWords.push(cleanWord);
      }
      synonyms[cleanWord].forEach(syn => {
        // Repeat synonyms 3 times to boost their weight too
        for (let k = 0; k < 3; k++) {
          expandedWords.push(syn);
        }
      });
    } else {
      expandedWords.push(word);
    }
  }
  
  return expandedWords.join(' ');
}

/**
 * Performs a search against a serialized index and returns matching chunks.
 * 
 * @param {string} indexJson - Serialized MiniSearch index.
 * @param {string} query - Search query string.
 * @param {number} [limit=5] - Maximum number of chunks to return.
 * @returns {Array<{ title: string, text: string, score: number }>} Matching chunks sorted by relevance score.
 */
export function searchIndex(indexJson, query, limit = 5) {
  if (!indexJson || !query) return [];

  try {
    const miniSearch = MiniSearch.loadJSON(indexJson, {
      fields: ['title', 'text'],
      storeFields: ['title', 'text']
    });

    const expandedQuery = expandQuery(query);
    const results = miniSearch.search(expandedQuery, {
      prefix: true,
      fuzzy: 0.2,
      boost: { title: 2 } // Boost search weight if keywords match the section title
    });

    return results.slice(0, limit).map(res => ({
      title: res.title,
      text: res.text,
      score: res.score
    }));
  } catch (e) {
    console.error('Failed to run in-memory index search:', e);
    return [];
  }
}

export { MiniSearch };
