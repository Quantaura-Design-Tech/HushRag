import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orgId, platform, token } = body;

    if (!orgId || !platform || !token) {
      return NextResponse.json({ error: 'Missing orgId, platform, or token.' }, { status: 400 });
    }

    if (platform !== 'telegram') {
      return NextResponse.json({ error: 'Only Telegram is supported for one-click connect.' }, { status: 400 });
    }

    const urlObj = new URL(request.url);
    const webhookUrl = `${urlObj.origin}/api/webhooks/telegram?orgId=${orgId}`;

    // 1. Register Webhook on Telegram
    const setWebhookRes = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    const setWebhookData = await setWebhookRes.json();

    if (!setWebhookData.ok) {
      return NextResponse.json({
        success: false,
        error: `Telegram setWebhook failed: ${setWebhookData.description || 'Unknown error'}`
      }, { status: 400 });
    }

    // 2. Fetch Bot details
    const getMeRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return NextResponse.json({
        success: false,
        error: `Telegram getMe failed: ${getMeData.description || 'Unknown error'}`
      }, { status: 400 });
    }

    const botName = getMeData.result.first_name;
    const botUsername = getMeData.result.username;

    // 3. Save to settings
    const db = await getDb('local');
    await db.run(
      `UPDATE settings SET telegram_token = ? WHERE org_id = ?`,
      token,
      orgId
    );

    return NextResponse.json({
      success: true,
      botName,
      botUsername
    });
  } catch (e) {
    console.error('Telegram bot connect error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('orgId');
    const token = searchParams.get('token');

    if (!orgId || !token) {
      return NextResponse.json({ error: 'Missing orgId or token.' }, { status: 400 });
    }

    // 1. Delete Webhook on Telegram
    const deleteWebhookRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
    const deleteWebhookData = await deleteWebhookRes.json();

    // 2. Clear token in settings database
    const db = await getDb('local');
    await db.run(
      `UPDATE settings SET telegram_token = '' WHERE org_id = ?`,
      orgId
    );

    return NextResponse.json({
      success: true,
      telegramDeleted: deleteWebhookData.ok
    });
  } catch (e) {
    console.error('Telegram bot disconnect error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
