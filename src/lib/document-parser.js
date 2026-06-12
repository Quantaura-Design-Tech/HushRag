import { createRequire } from 'module';
const require = createRequire(import.meta.url);



/**
 * Parses a document file buffer and converts it statelessly into a plain Markdown string.
 * Supports PDF, DOCX, TXT, and MD formats.
 * 
 * @param {Buffer} buffer - The raw file buffer.
 * @param {string} mimetype - The MIME type of the file.
 * @param {string} filename - The name of the file (used for extension backup).
 * @returns {Promise<string>} The parsed content in Markdown format.
 */
export async function parseDocumentToMarkdown(buffer, mimetype, filename = '') {
  const fileExt = filename.split('.').pop().toLowerCase();

  // 1. Handle PDF
  if (mimetype === 'application/pdf' || fileExt === 'pdf') {
    try {
      // Polyfill DOMMatrix for serverless/Node environments where pdf-parse/pdfjs-dist expects browser globals
      if (typeof globalThis.DOMMatrix === 'undefined') {
        globalThis.DOMMatrix = class DOMMatrix {
          constructor() {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
          }
          static fromMatrix() { return new DOMMatrix(); }
          static fromFloat32Array() { return new DOMMatrix(); }
          static fromFloat64Array() { return new DOMMatrix(); }
          translate() { return this; }
          scale() { return this; }
          multiply() { return this; }
          inverse() { return this; }
          transformPoint(p) { return p; }
        };
      }

      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText({ pageJoiner: '\n' });
      // Clean up multiple empty lines and page numbers
      let text = data.text;
      
      // Basic formatting cleanup: convert blocks of text into markdown paragraphs
      text = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple returns
        .trim();
        
      return text;
    } catch (e) {
      console.error('Failed to parse PDF document:', e);
      throw new Error(`PDF parsing failed: ${e.message}`);
    }
  }

  // 2. Handle Word Doc (.docx)
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    fileExt === 'docx'
  ) {
    try {
      const mammothModule = require('mammoth');
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.convertToMarkdown({ buffer });
      return result.value.trim();
    } catch (e) {
      console.error('Failed to parse DOCX document:', e);
      throw new Error(`DOCX parsing failed: ${e.message}`);
    }
  }

  // 3. Handle Text or Markdown
  if (
    mimetype === 'text/plain' || 
    mimetype === 'text/markdown' || 
    fileExt === 'txt' || 
    fileExt === 'md'
  ) {
    return buffer.toString('utf-8').trim();
  }

  throw new Error(`Unsupported file type: ${mimetype || fileExt}. Only PDF, DOCX, TXT, and MD are supported.`);
}
