import http from 'http';
import fs from 'fs';
import path from 'path';
import { parse } from 'url';

function loadEnv() {
  ['.env.local', '.env'].forEach(file => {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  });
}
loadEnv();

import uploadsHandler from './api/uploads.js';
import completeUploadHandler from './api/uploads/[id]/complete.js';
import cancelUploadHandler from './api/uploads/[id]/cancel.js';
import getFileHandler from './api/files/[id].js';
import downloadFileHandler from './api/download/[sessionId]/[fileId].js';
import downloadZipHandler from './api/download/[sessionId]/zip.js';
import storageStatusHandler from './api/storage-status.js';

const PORT = process.env.PORT || 3000;

function polyfillRes(res) {
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return res;
  };
  res.json = function (data) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-upsert');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  polyfillRes(res);

  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname;
  req.query = parsedUrl.query || {};

  // Read request body if present
  let body = '';
  req.on('data', chunk => { body += chunk; });
  await new Promise(resolve => req.on('end', resolve));

  try {
    if (body) {
      try {
        req.body = JSON.parse(body);
      } catch (e) {
        req.body = body;
      }
    } else {
      req.body = {};
    }
  } catch (e) {
    req.body = {};
  }

  // Route matching
  if (pathname === '/api/uploads') {
    return uploadsHandler(req, res);
  }

  if (pathname === '/api/storage-status') {
    return storageStatusHandler(req, res);
  }

  const completeMatch = pathname.match(/^\/api\/uploads\/([^/]+)\/complete$/);
  if (completeMatch) {
    req.query.id = completeMatch[1];
    return completeUploadHandler(req, res);
  }

  const cancelMatch = pathname.match(/^\/api\/uploads\/([^/]+)\/cancel$/);
  if (cancelMatch) {
    req.query.id = cancelMatch[1];
    return cancelUploadHandler(req, res);
  }

  const fileMatch = pathname.match(/^\/api\/files\/([^/]+)$/);
  if (fileMatch) {
    req.query.id = fileMatch[1];
    return getFileHandler(req, res);
  }

  const zipMatch = pathname.match(/^\/api\/download\/([^/]+)\/zip$/);
  if (zipMatch) {
    req.query.sessionId = zipMatch[1];
    return downloadZipHandler(req, res);
  }

  const downloadMatch = pathname.match(/^\/api\/download\/([^/]+)\/([^/]+)$/);
  if (downloadMatch) {
    req.query.sessionId = downloadMatch[1];
    req.query.fileId = downloadMatch[2];
    return downloadFileHandler(req, res);
  }

  if (pathname === '/api/storage-status') {
    return storageStatusHandler(req, res);
  }

  res.status(404).json({ error: 'Endpoint not found' });
});

server.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
});
