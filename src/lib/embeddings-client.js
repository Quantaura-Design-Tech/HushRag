// Polyfill Object.keys to handle undefined/null values safely for browser bundlers (like Next.js Turbopack)
// where imported node modules like 'fs' or 'path' are resolved to undefined inside @xenova/transformers.
if (typeof window !== 'undefined') {
  const originalKeys = Object.keys;
  Object.keys = function (obj) {
    if (obj === undefined || obj === null) {
      return [];
    }
    return originalKeys(obj);
  };
}

let pipe = null;

/**
 * Initializes and returns the `@xenova/transformers` feature-extraction pipeline.
 * Configures the library to disable local model checking, relying solely on Hugging Face CDN resources.
 * This runs entirely in-browser using WebAssembly.
 */
export async function getEmbeddingsPipeline(onProgress = null) {
  if (pipe) return pipe;
  
  const { pipeline, env } = await import('@xenova/transformers');
  
  // Disable searching for local files to avoid Next.js dev server/bundler file resolution crashes
  env.allowLocalModels = false;

  pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    progress_callback: (progress) => {
      if (onProgress && typeof onProgress === 'function') {
        onProgress(progress);
      }
    }
  });

  return pipe;
}

/**
 * Generates embeddings (384 dimensions) for an array of text chunks.
 */
export async function generateEmbeddings(texts, onProgress = null) {
  if (!Array.isArray(texts)) {
    console.warn('generateEmbeddings: expected array but received', texts);
    return [];
  }
  const extractor = await getEmbeddingsPipeline(onProgress);
  const embeddings = [];
  
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i] || '';
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    if (output && output.data) {
      embeddings.push(Array.from(output.data));
    } else {
      console.warn('generateEmbeddings: output.data is missing for chunk', i);
      embeddings.push(new Array(384).fill(0));
    }
  }
  
  return embeddings;
}

/**
 * Generates embedding (384 dimensions) for a single query string.
 */
export async function generateQueryEmbedding(text) {
  const extractor = await getEmbeddingsPipeline();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
