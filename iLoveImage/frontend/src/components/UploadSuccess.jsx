import React, { useState, useEffect } from 'react';
import { Copy, Check, QrCode, ArrowLeft, ExternalLink, X, FileText, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import { formatBytes } from '../utils/formatters';
import { cancelUpload } from '../utils/api';

export default function UploadSuccess({ shareData, onReset }) {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const fullShareUrl = `${window.location.origin}/#/f/${shareData.sessionId}`;

  // Countdown timer for 10 min expiry
  useEffect(() => {
    const updateCountdown = () => {
      const expires = new Date(shareData.expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [shareData.expiresAt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateQr = async () => {
    try {
      const url = await QRCode.toDataURL(fullShareUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#e8e8ec',
          light: '#222226'
        }
      });
      setQrDataUrl(url);
      setShowQrModal(true);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  const handleCancelSession = async () => {
    setCancelling(true);
    try {
      await cancelUpload(shareData.sessionId);
      onReset();
    } catch (err) {
      console.error('Failed to cancel session:', err);
      setCancelling(false);
    }
  };

  const files = shareData.files || [];
  const totalSizeBytes = files.reduce((sum, f) => sum + (f.sizeBytes || f.size || 0), 0);

  return (
    <div className="w-full max-w-[680px] mx-auto">
      <div className="bg-surface border border-border-default rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-default">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {files.length === 1 ? 'File Ready for Transfer' : `${files.length} Files Ready for Transfer`}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Stored with 100% byte fidelity &middot; Expire in 10 minutes</p>
          </div>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold px-2.5 py-1 rounded font-mono">
            ⏱ {timeLeft}
          </span>
        </div>

        {/* Files List Metadata */}
        <div className="bg-page p-4 rounded-xl border border-border-default space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-default">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {files.length} File{files.length !== 1 ? 's' : ''} ({formatBytes(totalSizeBytes)})
            </span>
            <span className="text-xs font-mono text-emerald-400 font-medium">100% Byte Exact</span>
          </div>

          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {files.map((file, idx) => (
              <div key={idx} className="bg-surface p-2.5 rounded-lg border border-border-default space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs font-medium text-text-primary">
                  <span className="truncate max-w-[320px]">{file.filename || file.name}</span>
                  <span className="font-mono text-text-muted">{formatBytes(file.sizeBytes || file.size)}</span>
                </div>
                {file.fileHash && (
                  <div className="font-mono text-[10px] text-text-muted truncate">
                    SHA-256: {file.fileHash}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shareable Link Box */}
        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            Shareable Download Link
          </label>
          <div className="flex items-center gap-2 bg-page p-1.5 rounded-lg border border-border-default">
            <input
              type="text"
              readOnly
              value={fullShareUrl}
              className="bg-transparent text-text-secondary text-xs font-mono px-2 flex-1 min-w-0"
            />
            <button
              onClick={handleCopy}
              className="bg-accent hover:bg-accent-hover text-white font-medium text-xs py-1.5 px-3 rounded-md transition-colors shrink-0 flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onReset}
              className="bg-surface-hover hover:bg-surface-elevated text-text-secondary font-medium py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-border-default flex-1 sm:flex-initial"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Upload More
            </button>
            <button
              onClick={handleGenerateQr}
              className="bg-surface-hover hover:bg-surface-elevated text-text-secondary font-medium py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-border-default flex-1 sm:flex-initial"
            >
              <QrCode className="w-3.5 h-3.5" /> QR Code
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={fullShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-hover hover:bg-surface-elevated text-text-secondary font-medium py-2 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 border border-border-default flex-1 sm:flex-initial"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Test Link
            </a>
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="bg-error-subtle hover:bg-error/20 text-error font-medium py-2 px-3 rounded-lg text-xs transition-colors border border-error/20 flex-1 sm:flex-initial"
            >
              Cancel Link
            </button>
          </div>
        </div>

        {/* Cancellation Confirmation Modal / Warning */}
        {showCancelConfirm && (
          <div className="p-4 rounded-xl bg-error-subtle border border-error/30 text-xs space-y-3">
            <div className="flex items-start gap-2.5 text-error">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-text-primary mb-0.5">Cancel & Expire Link?</strong>
                <p className="text-text-secondary text-[11px] leading-relaxed">
                  Cancelling will immediately expire the share link and permanently delete all uploaded files from storage. Files will no longer be available to download.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-surface text-text-secondary text-xs hover:text-text-primary border border-border-default"
                disabled={cancelling}
              >
                Keep Link
              </button>
              <button
                onClick={handleCancelSession}
                className="px-3 py-1.5 rounded-lg bg-error text-white font-medium text-xs hover:bg-red-600 transition-colors"
                disabled={cancelling}
              >
                {cancelling ? 'Deleting...' : 'Yes, Cancel & Delete'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-surface border border-border-default rounded-xl p-6 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-default">
              <h3 className="text-sm font-semibold text-text-primary">Device-to-Device Transfer</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Scan with a mobile camera to open the original file download page.
            </p>
            {qrDataUrl && (
              <div className="bg-page p-3 rounded-lg border border-border-default inline-block mb-4">
                <img src={qrDataUrl} alt="Download QR Code" className="w-48 h-48 mx-auto" />
              </div>
            )}
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-surface-hover hover:bg-surface-elevated text-text-primary font-medium text-xs py-2 rounded-lg transition-colors border border-border-default"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
