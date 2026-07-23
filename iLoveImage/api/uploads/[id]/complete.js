import { getSupabase } from '../../_lib/supabase.js';

/**
 * POST /api/uploads/:id/complete
 * Mark a session as 'ready' after all files have been uploaded.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const { id } = req.query;

    // Verify session exists and is pending
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ error: 'Upload session not found' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ error: `Session is already ${session.status}` });
    }

    // Update status to ready
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'ready' })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to complete session: ${updateError.message}`);
    }

    // Safely update lifetime global stats
    try {
      const { data: statsData } = await supabase.from('sessions').select('id, total_size_bytes').in('id', ['GLOBAL_STATS', 'GLOBAL_STATS_PICS']);
      
      let lifetimeBytes = 0;
      let lifetimeFiles = 0;

      if (statsData) {
        const picsRow = statsData.find(r => r.id === 'GLOBAL_STATS_PICS');
        const bytesRow = statsData.find(r => r.id === 'GLOBAL_STATS');
        if (picsRow) lifetimeFiles = Number(picsRow.total_size_bytes) || 0;
        if (bytesRow) lifetimeBytes = Number(bytesRow.total_size_bytes) || 0;
      }
      
      lifetimeBytes += Number(session.total_size_bytes || 0);

      // Query to find how many actual files were uploaded in this session
      const { count: sessionFilesCount } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', id);

      lifetimeFiles += (sessionFilesCount || 1); // fallback to 1 if count is somehow 0
      
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100).toISOString();

      await supabase.from('sessions').upsert([
        { id: 'GLOBAL_STATS', status: 'system', total_size_bytes: lifetimeBytes, expires_at: futureDate },
        { id: 'GLOBAL_STATS_PICS', status: 'system', total_size_bytes: lifetimeFiles, expires_at: futureDate }
      ], { onConflict: 'id' });
    } catch (statErr) {
      console.warn('Could not update global stats, ignoring:', statErr);
    }

    return res.status(200).json({
      sessionId: id,
      status: 'ready',
      shareUrl: `/f/${id}`,
      expiresAt: session.expires_at
    });
  } catch (err) {
    console.error('POST /api/uploads/:id/complete error:', err);
    return res.status(500).json({ error: err.message || 'Failed to complete upload' });
  }
}
