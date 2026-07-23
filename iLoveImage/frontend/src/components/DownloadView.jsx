import React, { useState, useEffect } from 'react';
import { Download, Check, AlertCircle, ArrowLeft, Loader2, FileText, Archive, CheckCircle2 } from 'lucide-react';
import { getSessionFiles } from '../utils/api';
import { formatBytes, formatExpiry, getFileCategory } from '../utils/formatters';
import { calculateBlobSHA256 } from '../utils/hash';
import ErrorCard from './ErrorCard';

export default function DownloadView({ fileId, onGoHome }) {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  // Verification & download state per file
  const [verifyingMap, setVerifyingMap] = useState({});
  const [verifyStatusMap, setVerifyStatusMap] = useState({});
  const [downloadingZip, setDownloadingZip] = useState(false);

  const fetchInfo = async () => {
    try {
      const data = await getSessionFiles(fileId);
      setSessionData(data);
    } catch (err) {
      console.error('Failed to load file link:', err);
      setErrorInfo({
        title: err.status === 'expired' ? 'Link Expired' : err.status === 'cancelled' ? 'Link Cancelled' : 'Link Not Found',
        message: err.message || 'This file link is invalid, expired, or has been cancelled.',
        type: err.status || 'not_found'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fileId) {
      fetchInfo();
    }
  }, [fileId]);

  const handleDownloadSingleFile = async (file) => {
    if (!file || file.status !== 'available' || !file.downloadUrl) return;

    setVerifyingMap(prev => ({ ...prev, [file.id]: true }));

    try {
      const response = await fetch(file.downloadUrl);
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Download request failed');
      }

      const blob = await response.blob();

      // Trigger browser save file dialog
      const downloadLink = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      downloadLink.href = objectUrl;
      downloadLink.download = file.filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(objectUrl);

      // Verify SHA-256 fingerprint
      const calculatedHash = await calculateBlobSHA256(blob);
      if (calculatedHash.toLowerCase() === file.fileHash.toLowerCase()) {
        setVerifyStatusMap(prev => ({ ...prev, [file.id]: 'matched' }));
      } else {
        setVerifyStatusMap(prev => ({ ...prev, [file.id]: 'mismatched' }));
      }

      // Authoritative backend re-fetch to confirm status update and storage release
      await fetchInfo();
    } catch (err) {
      console.error('Download error:', err);
      alert(err.message || 'Download failed or file already claimed.');
      await fetchInfo();
    } finally {
      setVerifyingMap(prev => ({ ...prev, [file.id]: false }));
    }
  };

  const handleDownloadAllZip = async () => {
    if (!sessionData || !sessionData.zipDownloadUrl) return;

    setDownloadingZip(true);
    try {
      const res = await fetch(sessionData.zipDownloadUrl);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate ZIP');
      }

      const blob = await res.blob();
      const downloadLink = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      downloadLink.href = objectUrl;
      downloadLink.download = `iLoveImage_${sessionData.sessionId}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(objectUrl);

      // Authoritative backend re-fetch
      await fetchInfo();
    } catch (err) {
      console.error('ZIP download error:', err);
      alert(err.message || 'Failed to download ZIP archive.');
      await fetchInfo();
    } finally {
      setDownloadingZip(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[520px] mx-auto py-12 text-center">
        <div className="bg-surface border border-border-default rounded-2xl py-10 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-accent animate-spin" />
          <p className="text-xs text-text-muted font-medium">Retrieving original file metadata...</p>
        </div>
      </div>
    );
  }

  if (errorInfo) {
    return <ErrorCard error={errorInfo} onGoHome={onGoHome} />;
  }

  const files = sessionData?.files || [];
  const availableFiles = files.filter(f => f.status === 'available');

  return (
    <div className="w-full max-w-[680px] mx-auto">
      <div className="bg-surface border border-border-default rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-default">
          <button
            onClick={onGoHome}
            className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to iLoveImage
          </button>
          <span className="bg-page text-text-muted border border-border-default text-[10px] font-mono px-2.5 py-1 rounded">
            {formatExpiry(sessionData?.expiresAt)}
          </span>
        </div>

        {/* Overview */}
        <div className="text-center py-2">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-page border border-border-default flex items-center justify-center text-accent">
            {files.length > 1 ? <Archive className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>

          <h1 className="text-xl font-bold text-text-primary mb-1">
            {files.length === 1 ? files[0].filename : `${files.length} Original Files Shared`}
          </h1>

          <p className="text-xs text-text-muted font-mono">
            Total Size: {formatBytes(sessionData?.totalSizeBytes)} &middot; Zero Recompression
          </p>
        </div>

        {/* Main Zip Download Button if multiple files available */}
        {files.length > 1 && availableFiles.length > 0 && (
          <button
            onClick={handleDownloadAllZip}
            disabled={downloadingZip}
            className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            {downloadingZip ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Bundling ZIP (Zero Compression)...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>Download All Available Files as ZIP</span>
              </>
            )}
          </button>
        )}

        {/* Individual File List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-text-muted font-medium px-1">
            <span>File List & Cryptographic Fingerprints</span>
            <span>{files.length} Item{files.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {files.map((file) => {
              const category = getFileCategory(file.filename, file.contentType);
              const isVerifying = verifyingMap[file.id];
              const verifyStatus = verifyStatusMap[file.id];
              const isAvailable = file.status === 'available';

              return (
                <div key={file.id} className="bg-page p-4 rounded-xl border border-border-default space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate max-w-[220px] sm:max-w-[340px]">
                          {file.filename}
                        </p>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isAvailable
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-surface text-text-muted border-border-default'
                        }`}>
                          {isAvailable ? 'Available' : 'Downloaded & Removed'}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted font-mono mt-1">
                        {formatBytes(file.sizeBytes)} &middot; <span className="text-text-muted">{category.label}</span>
                      </p>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={() => handleDownloadSingleFile(file)}
                        disabled={isVerifying}
                        className="bg-accent hover:bg-accent-hover text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>Download</span>
                      </button>
                    ) : (
                      <span className="text-xs text-text-muted font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-border-default shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-text-muted" />
                        <span>Claimed</span>
                      </span>
                    )}
                  </div>

                  {/* SHA-256 info */}
                  <div className="font-mono bg-surface text-text-muted p-2 rounded-lg border border-border-default text-[11px] break-all">
                    SHA-256: {file.fileHash}
                  </div>

                  {/* Verification Status */}
                  {verifyStatus === 'matched' && (
                    <div className="p-2.5 rounded-lg bg-success-subtle border border-success/20 text-success text-xs flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Verified — 100% Byte Match</span>
                    </div>
                  )}

                  {verifyStatus === 'mismatched' && (
                    <div className="p-2.5 rounded-lg bg-error-subtle border border-error/20 text-error text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Hash Mismatch Warning</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Single file download primary button fallback if only 1 file and available */}
        {files.length === 1 && files[0].status === 'available' && (
          <button
            onClick={() => handleDownloadSingleFile(files[0])}
            disabled={verifyingMap[files[0]?.id]}
            className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            {verifyingMap[files[0]?.id] ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading & Verifying Raw Bytes...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Original File & Verify Hash</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
