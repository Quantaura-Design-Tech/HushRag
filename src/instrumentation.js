export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.ENABLE_CLEANUP === 'false') return;

  const { runChatHistoryCleanup } = await import('./lib/cron-cleanup.js');

  const globalKey = Symbol.for('hushrag.cleanup.scheduler');
  const g = globalThis;
  if (g[globalKey]) return;
  g[globalKey] = { startedAt: Date.now() };

  const runSafely = async () => {
    try {
      await runChatHistoryCleanup();
    } catch (e) {
      console.error('[Cleanup Scheduler] Tick failed:', e);
    }
  };

  const delay = 5_000;
  setTimeout(() => {
    runSafely();
    setInterval(runSafely, 24 * 60 * 60 * 1000);
  }, delay);
}
