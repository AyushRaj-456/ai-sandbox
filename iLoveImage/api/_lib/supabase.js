import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for server-side API routes.
 * Uses the service_role key for full access (bypasses RLS).
 * Automatically sanitizes SUPABASE_URL to base protocol//host to prevent double-path routing errors.
 */
export function getSupabase() {
  let rawUrl = process.env.SUPABASE_URL;
  let rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !rawKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    return null;
  }

  let cleanUrl = rawUrl.trim().replace(/['"]/g, '');
  let cleanKey = rawKey.trim().replace(/['"]/g, '');

  try {
    const parsed = new URL(cleanUrl);
    cleanUrl = `${parsed.protocol}//${parsed.host}`;
  } catch (e) {
    cleanUrl = cleanUrl.replace(/\/+$/, '');
  }

  return createClient(cleanUrl, cleanKey, {
    auth: { persistSession: false }
  });
}

/**
 * Total Infrastructure Storage Capacity (10 GB)
 */
export const TOTAL_INFRASTRUCTURE_STORAGE_BYTES = 10 * 1024 * 1024 * 1024;

/**
 * Dedicated 10% Public Temporary Storage Pool Capacity (1 GB = 1,073,741,824 bytes)
 * Formula: PUBLIC_POOL_CAPACITY = TOTAL_UPLOADABLE_STORAGE_CAPACITY * 0.10
 */
export const PUBLIC_POOL_CAPACITY_BYTES = Math.floor(TOTAL_INFRASTRUCTURE_STORAGE_BYTES * 0.10);

/**
 * Fallback session expiry duration in minutes.
 */
export const EXPIRY_MINUTES = 10;

/**
 * Storage bucket name in Supabase Storage.
 */
export const STORAGE_BUCKET = 'uploads';

/**
 * Ensure storage bucket exists automatically using createBucket.
 */
export async function ensureBucketExists(supabase) {
  if (!supabase) return;
  try {
    await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 100 * 1024 * 1024
    });
  } catch (err) {
    // Ignore error if bucket already exists
  }
}

/**
 * Generate a short random ID.
 */
export function generateShortId(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Get current public storage pool usage.
 * Sums size_bytes of all active files ('available' or 'claimed') in active sessions.
 */
export async function getPublicStorageUsage(supabase) {
  if (!supabase) return 0;
  const now = new Date().toISOString();

  // Fetch active sessions that are pending or ready and not expired
  const { data: activeSessions, error: sessionErr } = await supabase
    .from('sessions')
    .select('id')
    .in('status', ['pending', 'ready'])
    .gt('expires_at', now);

  if (sessionErr || !activeSessions || activeSessions.length === 0) {
    return 0;
  }

  const sessionIds = activeSessions.map(s => s.id);

  // Sum size_bytes of files in these active sessions with status available or claimed
  const { data: activeFiles, error: fileErr } = await supabase
    .from('files')
    .select('size_bytes')
    .in('session_id', sessionIds)
    .in('status', ['available', 'claimed']);

  if (fileErr || !activeFiles) {
    return 0;
  }

  return activeFiles.reduce((sum, f) => sum + (Number(f.size_bytes) || 0), 0);
}

/**
 * Calculate public pool availability details.
 * NEVER exposes total infrastructure storage to users — only public pool details.
 */
export async function getPublicStorageStatus(supabase) {
  if (!supabase) {
    return {
      publicPoolCapacityBytes: PUBLIC_POOL_CAPACITY_BYTES,
      publicUsedBytes: 0,
      publicAvailableBytes: PUBLIC_POOL_CAPACITY_BYTES,
      usagePercent: 0
    };
  }

  const now = new Date().toISOString();
  
  // Calculate active users (x) based on active visitors pinging the site
  const { count: activeVisitorsCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'visitor')
    .gt('expires_at', now);

  const x = Math.max(1, activeVisitorsCount || 1);
  const user_quota = Math.floor((PUBLIC_POOL_CAPACITY_BYTES / x) / 2);

  const publicUsedBytes = await getPublicStorageUsage(supabase);
  const publicAvailableBytes = Math.max(0, user_quota - publicUsedBytes); // Wait, available_for_user = min(user_quota, raw_remaining)
  
  const raw_remaining = Math.max(0, PUBLIC_POOL_CAPACITY_BYTES - publicUsedBytes);
  const available_for_user = Math.min(user_quota, raw_remaining);
  const usagePercent = Math.round((publicUsedBytes / PUBLIC_POOL_CAPACITY_BYTES) * 100);

  return {
    publicPoolCapacityBytes: user_quota,
    publicUsedBytes,
    publicAvailableBytes: available_for_user,
    usagePercent
  };
}

/**
 * Lazy cleanup task: Purges expired, cancelled, or stuck claimed files.
 * Deletes objects from storage bucket and updates DB records.
 */
export async function cleanupExpired(supabase) {
  if (!supabase) return;
  const now = new Date().toISOString();

  // 0. Batch delete all expired visitor sessions efficiently
  await supabase
    .from('sessions')
    .delete()
    .eq('status', 'visitor')
    .lt('expires_at', now);

  // 1. Find sessions that passed 10-min expiration or are cancelled
  const { data: expiredSessions } = await supabase
    .from('sessions')
    .select('id, status')
    .neq('status', 'visitor') // Exclude visitors since we already deleted them
    .or(`expires_at.lt.${now},status.eq.cancelled`);

  if (expiredSessions && expiredSessions.length > 0) {
    const expiredSessionIds = expiredSessions.map(s => s.id);

    // Fetch all files for these expired sessions that need to be removed from storage
    const { data: files } = await supabase
      .from('files')
      .select('storage_path')
      .in('session_id', expiredSessionIds)
      .in('status', ['available', 'claimed']);

    if (files && files.length > 0) {
      const pathsToDelete = files.map(f => f.storage_path).filter(Boolean);
      
      if (pathsToDelete.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(pathsToDelete);
      }

      // Mark all these files as expired
      await supabase
        .from('files')
        .update({ status: 'expired' })
        .in('session_id', expiredSessionIds)
        .in('status', ['available', 'claimed']);
    }

    // Update session status to expired if not already cancelled
    await supabase
      .from('sessions')
      .update({ status: 'expired' })
      .in('id', expiredSessionIds)
      .neq('status', 'cancelled');
  }

  // 2. Cleanup stuck 'claimed' files older than 2 minutes (in case download stream crashed)
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: stuckFiles } = await supabase
    .from('files')
    .select('id, storage_path, session_id')
    .eq('status', 'claimed')
    .lt('downloaded_at', twoMinAgo);

  if (stuckFiles && stuckFiles.length > 0) {
    const paths = stuckFiles.map(f => f.storage_path);
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);

    for (const f of stuckFiles) {
      await supabase
        .from('files')
        .update({ status: 'expired' })
        .eq('id', f.id);
    }
  }
}
