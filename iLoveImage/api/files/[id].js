import { getSupabase, cleanupExpired } from '../_lib/supabase.js';

/**
 * GET /api/files/:id
 * Retrieve session metadata and file statuses.
 * Per-file status: 'available', 'downloaded', 'claimed', 'expired'.
 * Download URL for available files points to the backend stream endpoint /api/download/:sessionId/:fileId.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    const { id } = req.query;

    // Lazy cleanup — fire-and-forget
    cleanupExpired(supabase).catch(() => {});

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'File link not found', status: 'not_found' });
    }

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      if (session.status !== 'expired') {
        await supabase.from('sessions').update({ status: 'expired' }).eq('id', id);
      }
      return res.status(410).json({
        error: 'This file link has expired and is no longer available.',
        status: 'expired'
      });
    }

    // Check status
    if (session.status === 'cancelled') {
      return res.status(410).json({
        error: 'This upload link was cancelled by the sender. Files are no longer available.',
        status: 'cancelled'
      });
    }

    if (session.status === 'expired') {
      return res.status(410).json({
        error: 'This file link has expired and is no longer available.',
        status: 'expired'
      });
    }

    if (session.status !== 'ready' && session.status !== 'completed') {
      return res.status(400).json({
        error: 'Files are not yet ready for download.',
        status: session.status
      });
    }

    // Fetch all files for this session
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('session_id', id);

    if (filesError) {
      throw new Error(`Failed to fetch files: ${filesError.message}`);
    }

    const fileList = (files || []).map(file => ({
      id: file.id,
      filename: file.filename,
      contentType: file.content_type,
      sizeBytes: file.size_bytes,
      fileHash: file.file_hash,
      status: file.status, // 'available', 'claimed', 'downloaded', 'expired'
      downloadUrl: file.status === 'available' ? `/api/download/${session.id}/${file.id}` : null
    }));

    const availableCount = fileList.filter(f => f.status === 'available').length;

    return res.status(200).json({
      sessionId: session.id,
      status: session.status,
      totalSizeBytes: session.total_size_bytes,
      uploadedAt: session.uploaded_at,
      expiresAt: session.expires_at,
      availableCount,
      zipDownloadUrl: availableCount > 0 ? `/api/download/${session.id}/zip` : null,
      files: fileList
    });
  } catch (err) {
    console.error('GET /api/files/:id error:', err);
    return res.status(500).json({ error: err.message || 'Failed to retrieve file data' });
  }
}
