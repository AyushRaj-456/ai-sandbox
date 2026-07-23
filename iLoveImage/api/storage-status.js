import { getSupabase, getPublicStorageStatus, cleanupExpired, PUBLIC_POOL_CAPACITY_BYTES } from './_lib/supabase.js';

/**
 * GET /api/storage-status
 * Returns authoritative available storage inside the dedicated 10% public pool.
 * Does NOT expose total infrastructure capacity.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(200).json({
        publicPoolCapacityBytes: PUBLIC_POOL_CAPACITY_BYTES,
        publicUsedBytes: 0,
        publicAvailableBytes: PUBLIC_POOL_CAPACITY_BYTES,
        usagePercent: 0
      });
    }

    // Lazy cleanup first
    await cleanupExpired(supabase);

    const clientId = req.query?.clientId || 'unknown';
    
    // Heartbeat: register or update this visitor as active
    if (clientId !== 'unknown') {
      try {
        await supabase.from('sessions').upsert({
          id: clientId,
          status: 'visitor',
          total_size_bytes: 0,
          expires_at: new Date(Date.now() + 15000).toISOString() // expires in 15s (polling is every 5s)
        }, { onConflict: 'id' });
      } catch (err) {
        console.error('Failed to update visitor heartbeat:', err);
      }
    }

    const status = await getPublicStorageStatus(supabase);

    // Fetch lifetime global stats using two separate rows since file_count column doesn't exist
    const { data: globalStats } = await supabase
      .from('sessions')
      .select('id, total_size_bytes')
      .in('id', ['GLOBAL_STATS', 'GLOBAL_STATS_PICS']);

    let totalTransfersCompleted = 0;
    let totalStorageTransferredBytes = 0;

    if (globalStats) {
      const picsRow = globalStats.find(r => r.id === 'GLOBAL_STATS_PICS');
      const bytesRow = globalStats.find(r => r.id === 'GLOBAL_STATS');
      if (picsRow) totalTransfersCompleted = Number(picsRow.total_size_bytes) || 0;
      if (bytesRow) totalStorageTransferredBytes = Number(bytesRow.total_size_bytes) || 0;
    }

    return res.status(200).json({
      publicAvailableBytes: status.publicAvailableBytes,
      publicUsedBytes: status.publicUsedBytes,
      publicPoolCapacityBytes: status.publicPoolCapacityBytes,
      usagePercent: status.usagePercent,
      totalTransfersCompleted,
      totalStorageTransferredBytes
    });
  } catch (err) {
    console.error('GET /api/storage-status error:', err);
    return res.status(200).json({
      publicPoolCapacityBytes: PUBLIC_POOL_CAPACITY_BYTES,
      publicUsedBytes: 0,
      publicAvailableBytes: PUBLIC_POOL_CAPACITY_BYTES,
      usagePercent: 0,
      totalTransfersCompleted: 0,
      totalStorageTransferredBytes: 0
    });
  }
}

