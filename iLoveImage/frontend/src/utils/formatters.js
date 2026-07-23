/**
 * Formatter Utilities for iLoveImage (Plain JS)
 */

export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatHash(hash) {
  if (!hash) return '';
  if (hash.length <= 16) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}

export function formatExpiry(isoDateString) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString);
  const now = new Date();
  const diffMs = date - now;

  if (diffMs <= 0) return 'Expired';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} remaining`;
  }
  return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
}

export function getFileCategory(filename, contentType) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mime = contentType?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'].includes(ext) || mime.startsWith('image/')) {
    if (['heic', 'heif'].includes(ext)) return { label: 'HEIC Photo', color: 'badge-purple' };
    if (['raw', 'cr2', 'nef', 'arw', 'dng', 'orf'].includes(ext)) return { label: 'RAW Photo', color: 'badge-purple' };
    if (['tiff', 'tif'].includes(ext)) return { label: 'TIFF Image', color: 'badge-purple' };
    return { label: ext.toUpperCase() + ' Image', color: 'badge-cyan' };
  }
  return { label: ext.toUpperCase() || 'Binary File', color: 'badge-purple' };
}
