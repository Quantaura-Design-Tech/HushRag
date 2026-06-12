import { NextResponse } from 'next/server';
import { parseDocumentToMarkdown } from '@/lib/document-parser';

export const runtime = 'nodejs'; // Required for pdf-parse (native dependencies)

/**
 * Stateless API route to parse files into plaintext Markdown.
 * Used by the E2EE dashboard so the client browser can retrieve the text,
 * encrypt it locally, and upload the encrypted ciphertext.
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimetype = file.type;
    const filename = file.name;

    // Parse the file to raw markdown text
    const markdown = await parseDocumentToMarkdown(buffer, mimetype, filename);

    return NextResponse.json({
      filename,
      markdown
    });
  } catch (e) {
    console.error('File parsing endpoint error:', e);
    return NextResponse.json({ error: `File parsing failed: ${e.message}` }, { status: 500 });
  }
}
