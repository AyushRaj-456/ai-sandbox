import { getSupabase, STORAGE_BUCKET, cleanupExpired } from '../../_lib/supabase.js';

/**
 * GET /api/download/:sessionId/:fileId
 * Single-Download Endpoint with Atomic State Transition & Safe Immediate Storage Purge.
 *
 * Flow:
 * 1. Atomically transitions file status: 'available' -> 'claimed'.
 * 2. Generates a short-lived signed URL and fetches raw file bytes.
 * 3. Streams/sends raw bytes to recipient.
 * 4. Upon successful download, deletes file object from storage bucket & marks file as 'downloaded'.
 * 5. Releases public storage pool space immediately.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, fileId } = req.query;
  const supabase = getSupabase();

  // Lazy cleanup — fire-and-forget, don't block download
  cleanupExpired(supabase).catch(() => {});

  try {
    // 1. Atomic State Transition: 'available' -> 'claimed'
    const nowIso = new Date().toISOString();
    const { data: claimedFiles, error: claimErr } = await supabase
      .from('files')
      .update({ status: 'claimed', downloaded_at: nowIso })
      .eq('id', fileId)
      .eq('session_id', sessionId)
      .eq('status', 'available')
      .select('*');

    if (claimErr || !claimedFiles || claimedFiles.length === 0) {
      // Check why claim failed
      const { data: existingFile } = await supabase
        .from('files')
        .select('status')
        .eq('id', fileId)
        .eq('session_id', sessionId)
        .single();

      if (existingFile) {
        if (existingFile.status === 'downloaded' || existingFile.status === 'deleted') {
          return res.status(410).json({ error: 'This file has already been downloaded and removed.', status: 'downloaded' });
        }
        if (existingFile.status === 'claimed') {
          return res.status(409).json({ error: 'Download is currently in progress by another request.', status: 'claimed' });
        }
        if (existingFile.status === 'expired') {
          return res.status(410).json({ error: 'This file link has expired.', status: 'expired' });
        }
      }

      return res.status(404).json({ error: 'File not found or no longer available.', status: 'not_found' });
    }

    const fileRecord = claimedFiles[0];

    // 2. Fetch file from public Supabase Storage URL (bucket is public — no auth needed)
    let supabaseBaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/['\"]/g, '');
    try {
      const parsed = new URL(supabaseBaseUrl);
      supabaseBaseUrl = `${parsed.protocol}//${parsed.host}`;
    } catch (e) {
      supabaseBaseUrl = supabaseBaseUrl.replace(/\/+$/, '');
    }

    const publicFileUrl = `${supabaseBaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${fileRecord.storage_path}`;
    const fileResponse = await fetch(publicFileUrl);

    if (!fileResponse.ok) {
      const errText = await fileResponse.text().catch(() => '');
      console.error('Storage fetch error:', fileResponse.status, errText);
      await supabase.from('files').update({ status: 'available', downloaded_at: null }).eq('id', fileId);
      return res.status(500).json({ error: 'Failed to retrieve file from storage', detail: `HTTP ${fileResponse.status}: ${errText.slice(0, 200)}` });
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Set headers for binary download
    res.setHeader('Content-Type', fileRecord.content_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileRecord.filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // 4. Send raw file bytes to recipient
    res.status(200).send(buffer);

    // 5. Post-Download Safe Cleanup: Delete storage object & release capacity
    try {
      await supabase.storage.from(STORAGE_BUCKET).remove([fileRecord.storage_path]);

      await supabase
        .from('files')
        .update({ status: 'downloaded', downloaded_at: new Date().toISOString() })
        .eq('id', fileId);

      const { data: remainingFiles } = await supabase
        .from('files')
        .select('id')
        .eq('session_id', sessionId)
        .in('status', ['available', 'claimed']);

      if (!remainingFiles || remainingFiles.length === 0) {
        await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId);
      }
    } catch (cleanupErr) {
      console.error('Post-download storage purge error:', cleanupErr);
    }
  } catch (err) {
    console.error('Download handler error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'Download failed' });
    }
  }
}
