/**
 * Web Crypto API SHA-256 Hasher (Plain JS)
 * Uses chunked Blob slicing to calculate SHA-256 hash without freezing UI
 */

export async function calculateSHA256(file, onProgress = () => {}) {
  const chunkSize = 2 * 1024 * 1024; // 2 MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);

  // We process in memory using subtle crypto digest for complete file
  // For files under 100MB, arrayBuffer or chunked crypto processing is fast and compliant
  if (file.size <= 10 * 1024 * 1024) {
    onProgress(30);
    const buffer = await file.arrayBuffer();
    onProgress(70);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    onProgress(100);
    return bufferToHex(hashBuffer);
  }

  // Chunked progress calculation for larger files
  let processed = 0;
  const combinedBuffer = new Uint8Array(file.size);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunkBlob = file.slice(start, end);
    const chunkArray = new Uint8Array(await chunkBlob.arrayBuffer());

    combinedBuffer.set(chunkArray, start);
    processed += chunkArray.byteLength;

    const progress = Math.round((processed / file.size) * 90);
    onProgress(progress);
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', combinedBuffer.buffer);
  onProgress(100);
  return bufferToHex(hashBuffer);
}

export async function calculateBlobSHA256(blob) {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(hashBuffer);
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
