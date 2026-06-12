import { getDb } from './index';

/**
 * Prunes expired chat sessions for all organizations.
 * Should be triggered by a cron job or startup routine.
 */
export async function runChatHistoryCleanup() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  console.log(`[TTL Cleanup] Pruning chats older than: ${cutoff}`);

  try {
    // 1. Get the local/master database instance to list organizations
    const masterDb = await getDb('local');
    const orgs = await masterDb.all('SELECT id FROM organizations');

    let totalPruned = 0;
    // 2. Loop through all active organizations and run the cleanup on their respective DBs
    for (const org of orgs) {
      try {
        const db = await getDb(org.id);
        const result = await db.cleanupChatSessions(org.id, cutoff);
        if (result && result.deletedCount > 0) {
          console.log(`[TTL Cleanup] Deleted ${result.deletedCount} sessions for Org: ${org.id}`);
          totalPruned += result.deletedCount;
        }
      } catch (orgError) {
        console.error(`[TTL Cleanup] Error pruning Org ${org.id}:`, orgError);
      }
    }
    console.log(`[TTL Cleanup] Completed. Total sessions pruned: ${totalPruned}`);
    return { success: true, totalPruned };
  } catch (e) {
    console.error('[TTL Cleanup] Failed to run cron cleanup:', e);
    return { success: false, error: e.message };
  }
}
