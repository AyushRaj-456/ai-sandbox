import {
  getSupabase,
  generateShortId,
  getPublicStorageStatus,
  cleanupExpired,
  ensureBucketExists,
  EXPIRY_MINUTES,
  STORAGE_BUCKET
} from './_lib/supabase.js';

/**
 * POST /api/uploads
 * Create an upload session in the 10% public storage pool.
 * Backend enforces that total size cannot exceed available public pool capacity.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(500).json({ error: 'Database and storage are currently unconfigured.' });
    }

    // Ensure bucket exists & lazy cleanup — fire-and-forget, don't block upload
    ensureBucketExists(supabase).catch(() => {});
    cleanupExpired(supabase).catch(() => {});

    const { files } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided. Send { files: [...] }' });
    }

    if (files.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 files per upload session.' });
    }

    // Validate files & calculate total batch size
    const MAX_SINGLE_FILE = 100 * 1024 * 1024; // 100 MB max per file
    let totalSize = 0;

    for (const file of files) {
      if (!file.filename || !file.sizeBytes || !file.fileHash) {
        return res.status(400).json({ error: 'Each file must have filename, sizeBytes, and fileHash.' });
      }
      if (file.sizeBytes > MAX_SINGLE_FILE) {
        return res.status(400).json({ error: `File "${file.filename}" exceeds the 100 MB per-file limit.` });
      }
      totalSize += Number(file.sizeBytes);
    }

    // Authoritative Backend Validation against 10% Public Storage Pool
    const storageStatus = await getPublicStorageStatus(supabase);
    const availableBytes = storageStatus.publicAvailableBytes;

    if (totalSize > availableBytes) {
      const availMB = (availableBytes / (1024 * 1024)).toFixed(1);
      const totalMB = (totalSize / (1024 * 1024)).toFixed(1);
      return res.status(400).json({
        error: `Selected upload size (${totalMB} MB) exceeds currently available temporary storage (${availMB} MB).`
      });
    }

    // Create session (10-minute fallback expiry)
    const sessionId = generateShortId(10);
    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        status: 'pending',
        total_size_bytes: totalSize,
        expires_at: expiresAt
      });

    if (sessionError) {
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    // Create file records & direct storage upload endpoints
    const fileResults = [];
    const rawUrl = (process.env.SUPABASE_URL || '').trim().replace(/['"]/g, '');
    let supabaseUrl = rawUrl;
    try {
      const parsed = new URL(rawUrl);
      supabaseUrl = `${parsed.protocol}//${parsed.host}`;
    } catch (e) {
      supabaseUrl = rawUrl.replace(/\/+$/, '');
    }

    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['"]/g, '');

    for (const file of files) {
      const fileId = generateShortId(8);
      const ext = file.filename.includes('.') ? file.filename.split('.').pop() : 'bin';
      const storagePath = `${sessionId}_${fileId}.${ext}`;

      // Insert file record with initial status 'available'
      const { error: fileError } = await supabase
        .from('files')
        .insert({
          id: fileId,
          session_id: sessionId,
          storage_path: storagePath,
          filename: file.filename,
          content_type: file.contentType || 'application/octet-stream',
          size_bytes: file.sizeBytes,
          file_hash: file.fileHash.toLowerCase(),
          status: 'available'
        });

      if (fileError) {
        throw new Error(`Failed to create file record: ${fileError.message}`);
      }

      // Always use direct REST endpoint — skip createSignedUploadUrl which expects
      // PUT with raw bytes but our frontend sends POST with FormData
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`;
      const token = serviceKey;

      fileResults.push({
        fileId,
        filename: file.filename,
        storagePath,
        uploadUrl,
        token
      });
    }

    return res.status(201).json({
      sessionId,
      expiresAt,
      files: fileResults
    });
  } catch (err) {
    console.error('POST /api/uploads error:', err);
    return res.status(500).json({ error: err.message || 'Failed to initialize upload' });
  }
}
