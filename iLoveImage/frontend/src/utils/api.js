/**
 * API Client for iLoveImage — Vercel + Supabase backend
 */

/**
 * Create a multi-file upload session.
 * Returns sessionId, expiresAt, and per-file upload parameters.
 */
export async function createUploadSession(files) {
  const response = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: files.map(f => ({
        filename: f.name,
        contentType: f.type || 'application/octet-stream',
        sizeBytes: f.size,
        fileHash: f.hash
      }))
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload initialization failed (${response.status})`);
  }

  return await response.json();
}

/**
 * Upload a single file to Supabase Storage using FormData POST endpoint.
 * Supabase Storage REST API requires multipart FormData payload for direct POST uploads.
 */
export function uploadFileToSignedUrl(uploadUrl, token, file, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        let errorDetails = `HTTP ${xhr.status}`;
        try {
          const resJson = JSON.parse(xhr.responseText);
          if (resJson.message || resJson.error) {
            errorDetails += `: ${resJson.message || resJson.error}`;
          }
        } catch (e) {
          if (xhr.responseText) {
            errorDetails += `: ${xhr.responseText.slice(0, 100)}`;
          }
        }
        reject(new Error(`Upload failed with ${errorDetails}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    // Use PUT with raw file bytes — standard Supabase Storage upload
    xhr.open('PUT', uploadUrl);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', token);
    }
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.send(file); // raw File object, not FormData
  });
}

/**
 * Complete an upload session (mark as ready for sharing).
 */
export async function completeUpload(sessionId) {
  const response = await fetch(`/api/uploads/${encodeURIComponent(sessionId)}/complete`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to complete upload session');
  }

  return await response.json();
}

/**
 * Cancel an upload session (delete files, expire link).
 */
export async function cancelUpload(sessionId) {
  const response = await fetch(`/api/uploads/${encodeURIComponent(sessionId)}/cancel`, {
    method: 'POST'
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to cancel upload');
  }

  return await response.json();
}

/**
 * Get file session metadata and download URLs.
 */
export async function getSessionFiles(sessionId) {
  const response = await fetch(`/api/files/${encodeURIComponent(sessionId)}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.error || `File request failed (${response.status})`);
    err.status = errorData.status || (response.status === 410 ? 'expired' : 'not_found');
    throw err;
  }

  return await response.json();
}

/**
 * Get current storage usage status.
 */
export async function getStorageStatus(clientId) {
  const url = clientId ? `/api/storage-status?clientId=${encodeURIComponent(clientId)}` : '/api/storage-status';
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error('Failed to fetch storage status');
  }

  return await response.json();
}
