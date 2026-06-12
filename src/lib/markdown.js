/**
 * Safe, lightweight client-side markdown to HTML parser.
 * Escapes HTML characters to prevent XSS.
 */
export function parseMarkdown(text) {
  if (!text) return '';

  // 1. Escape HTML to prevent XSS (but preserve <br> tags used for inline breaks in tables/lists)
  let html = text
    .replace(/<br\s*\/?>/gi, '___BR_PLACEHOLDER___')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/___BR_PLACEHOLDER___/g, '<br />');

  const lines = html.split('\n');
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  let inTable = false;
  const resultLines = [];

  for (let line of lines) {
    let trimmed = line.trim();
    
    // Check if line starts with a pipe to signify a table row
    if (trimmed.startsWith('|')) {
      // Close list if we were in one
      if (inList) {
        resultLines.push(`</${listType}>`);
        inList = false;
      }

      // Check if it is a table separator line (contains only pipes, dashes, colons, spaces)
      if (/^[|:\s-]+$/.test(trimmed)) {
        continue;
      }

      const cells = line.split('|').map(c => c.trim());
      // Shift/pop if starting/ending with a pipe
      if (cells[0] === '') cells.shift();
      if (cells[cells.length - 1] === '') cells.pop();

      if (!inTable) {
        inTable = true;
        resultLines.push('<div class="table-container"><table><thead><tr>');
        cells.forEach(cell => {
          resultLines.push(`<th>${cell}</th>`);
        });
        resultLines.push('</tr></thead><tbody>');
      } else {
        resultLines.push('<tr>');
        cells.forEach(cell => {
          resultLines.push(`<td>${cell}</td>`);
        });
        resultLines.push('</tr>');
      }
      continue;
    } else {
      // If we were in a table and current line is not a table row, close the table
      if (inTable) {
        resultLines.push('</tbody></table></div>');
        inTable = false;
      }
    }

    // Check for headers (e.g. ### Title)
    if (trimmed.startsWith('### ')) {
      if (inList) { resultLines.push(`</${listType}>`); inList = false; }
      resultLines.push(`<h3>${trimmed.substring(4)}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      if (inList) { resultLines.push(`</${listType}>`); inList = false; }
      resultLines.push(`<h2>${trimmed.substring(3)}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      if (inList) { resultLines.push(`</${listType}>`); inList = false; }
      resultLines.push(`<h1>${trimmed.substring(2)}</h1>`);
      continue;
    }

    // Check for bullet list item: starts with "-" or "*"
    const bulletMatch = line.match(/^(\s*)[-\*]\s+(.*)$/);
    if (bulletMatch) {
      if (!inList || listType !== 'ul') {
        if (inList) resultLines.push(`</${listType}>`);
        resultLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      resultLines.push(`<li>${bulletMatch[2]}</li>`);
      continue;
    }

    // Check for numbered list item: starts with digit followed by dot
    const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numberMatch) {
      if (!inList || listType !== 'ol') {
        if (inList) resultLines.push(`</${listType}>`);
        resultLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      resultLines.push(`<li>${numberMatch[2]}</li>`);
      continue;
    }

    // Plain line: if we were in a list, close it
    if (inList && trimmed === '') {
      resultLines.push(`</${listType}>`);
      inList = false;
    }

    if (trimmed !== '') {
      if (inList) {
        resultLines.push(`</${listType}>`);
        inList = false;
      }
      resultLines.push(`<p>${line}</p>`);
    } else {
      // Empty line
      resultLines.push('<div class="spacer"></div>');
    }
  }

  // Final checks after loop
  if (inTable) {
    resultLines.push('</tbody></table></div>');
  }
  if (inList) {
    resultLines.push(`</${listType}>`);
  }

  // Join lines and perform inline bold/italics replacements
  let finalHtml = resultLines.join('\n');
  
  // Bold: **text**
  finalHtml = finalHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italics: *text* and _text_
  finalHtml = finalHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');
  finalHtml = finalHtml.replace(/_(.*?)_/g, '<em>$1</em>');

  return finalHtml;
}
