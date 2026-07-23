import { getSupabase, STORAGE_BUCKET, cleanupExpired } from '../../_lib/supabase.js';
import JSZip from 'jszip';

/**
 * GET /api/download/:sessionId/zip
 * Multi-File ZIP Download Endpoint with Atomic Claim & Safe Storage Purge.
 * Bundles all available files into a ZIP using STORE mode (0% compression = exact raw bytes).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;
  const supabase = getSupabase();

  try {
    // Lazy cleanup first
    await cleanupExpired(supabase);

    const nowIso = new Date().toISOString();

    // 1. Fetch available files for this session
    const { data: availableFiles } = await supabase
      .from('files')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'available');

    if (!availableFiles || availableFiles.length === 0) {
      return res.status(410).json({ error: 'No available files remaining for this link.', status: 'expired' });
    }

    const fileIdsToClaim = availableFiles.map(f => f.id);

    // 2. Atomically claim available files
    const { data: claimedFiles, error: claimErr } = await supabase
      .from('files')
      .update({ status: 'claimed', downloaded_at: nowIso })
      .eq('session_id', sessionId)
      .in('id', fileIdsToClaim)
      .eq('status', 'available')
      .select('*');

    if (claimErr || !claimedFiles || claimedFiles.length === 0) {
      return res.status(409).json({ error: 'Files are currently being downloaded by another request.', status: 'claimed' });
    }

    // 3. Build ZIP using JSZip with STORE mode (0% compression, exact raw bytes)
    const zip = new JSZip();
    const pathsToDelete = [];

    for (const fileRecord of claimedFiles) {
      const { data: blob } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .download(fileRecord.storage_path);

      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        zip.file(fileRecord.filename, arrayBuffer, { compression: 'STORE' });
        pathsToDelete.push(fileRecord.storage_path);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });

    // 4. Send ZIP binary response
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="iLoveImage_${sessionId}.zip"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    res.status(200).send(zipBuffer);

    // 5. Post-Download Safe Cleanup: Delete storage objects & release public pool storage
    try {
      if (pathsToDelete.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(pathsToDelete);
      }

      const fileIdsProcessed = claimedFiles.map(f => f.id);
      await supabase
        .from('files')
        .update({ status: 'downloaded', downloaded_at: new Date().toISOString() })
        .in('id', fileIdsProcessed);

      // Check if session completed
      const { data: remaining } = await supabase
        .from('files')
        .select('id')
        .eq('session_id', sessionId)
        .in('status', ['available', 'claimed']);

      if (!remaining || remaining.length === 0) {
        await supabase
          .from('sessions')
          .update({ status: 'completed' })
          .eq('id', sessionId);
      }
    } catch (cleanupErr) {
      console.error('Post-ZIP download storage purge error:', cleanupErr);
    }
  } catch (err) {
    console.error('ZIP download error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || 'ZIP download failed' });
    }
  }
}
