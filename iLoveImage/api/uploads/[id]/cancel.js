import { getSupabase, STORAGE_BUCKET } from '../../_lib/supabase.js';

/**
 * POST /api/uploads/:id/cancel
 * Cancel an upload session — deletes files from storage and marks session as cancelled.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const { id } = req.query;

    // Verify session exists
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'cancelled' || session.status === 'expired') {
      return res.status(200).json({ message: 'Session already cancelled/expired' });
    }

    // Get all files for this session
    const { data: files } = await supabase
      .from('files')
      .select('storage_path')
      .eq('session_id', id);

    // Delete files from Supabase Storage
    if (files && files.length > 0) {
      const paths = files.map(f => f.storage_path);
      const { error: removeError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .remove(paths);

      if (removeError) {
        console.error('Storage remove error:', removeError);
      }
    }

    // Mark session as cancelled
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to cancel session: ${updateError.message}`);
    }

    return res.status(200).json({
      sessionId: id,
      status: 'cancelled',
      message: 'Upload cancelled. Files have been deleted and the link is expired.'
    });
  } catch (err) {
    console.error('POST /api/uploads/:id/cancel error:', err);
    return res.status(500).json({ error: err.message || 'Failed to cancel upload' });
  }
}
