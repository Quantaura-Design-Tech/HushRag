import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET: Lists category folders for an organization in plaintext
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter.' }, { status: 400 });
    }

    const db = await getDb(orgId);
    const categories = await db.getCategories(orgId);

    return NextResponse.json(categories);
  } catch (e) {
    console.error('GET categories error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * POST: Saves a category folder in plaintext
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { orgId, categoryId, name, description } = body;

    if (!orgId || !categoryId || !name) {
      return NextResponse.json({ error: 'Missing required category fields.' }, { status: 400 });
    }

    const db = await getDb(orgId);
    const result = await db.saveCategory(orgId, categoryId, {
      name,
      description
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (e) {
    console.error('POST category error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * DELETE: Deletes a category folder and its contents
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const categoryId = searchParams.get('categoryId');

    if (!orgId || !categoryId) {
      return NextResponse.json({ error: 'Missing orgId or categoryId parameters.' }, { status: 400 });
    }

    const db = await getDb(orgId);
    await db.deleteCategory(orgId, categoryId);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE category error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
