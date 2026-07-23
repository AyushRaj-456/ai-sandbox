import { getSupabase, cleanupExpired } from '../_lib/supabase.js';

/**
 * GET /api/cron/cleanup
 * Vercel Cron trigger — runs every 2 minutes to clean expired files.
 * Also called internally as lazy cleanup from other endpoints.
 */
export default async function handler(req, res) {
  try {
    const supabase = getSupabase();
    await cleanupExpired(supabase);

    return res.status(200).json({ ok: true, message: 'Cleanup completed' });
  } catch (err) {
    console.error('Cron cleanup error:', err);
    return res.status(500).json({ error: err.message || 'Cleanup failed' });
  }
}
