import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

export default function Header() {
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <header className="w-full border-b border-border-subtle bg-page-alt/80 sticky top-0 z-40 backdrop-blur-md">
      <div className="page-container h-16 flex items-center justify-between">
        {/* Left: Brand + Badge */}
        <a href="#/" className="flex items-center gap-3">
          <span className="font-display font-bold text-xl tracking-tight text-text-primary">
            iLoveImage
          </span>
          <span className="bg-surface text-text-muted border border-border-default text-[11px] font-mono px-2.5 py-1 rounded hidden sm:inline-flex">
            100% Byte Exact
          </span>
        </a>

        {/* Right: How It Works */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="text-[13px] font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"
          aria-label="How it works"
        >
          How It Works
        </button>
      </div>

      {/* Information Modal - Rendered via Portal to document.body to avoid sticky header stacking context */}
      {showInfoModal && createPortal(
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className="bg-surface border border-border-default rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-default">
              <h3 className="text-base font-semibold text-text-primary">How iLoveImage Works</h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-[13px] text-text-secondary leading-relaxed">
              <p>
                Standard messaging platforms silently recompress and downscale photos before transmission. iLoveImage moves exact raw file bytes directly from your browser to storage.
              </p>

              <div className="bg-page p-4 rounded-xl border border-border-default space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary block font-medium text-[13px]">Zero Byte Modification</strong>
                    <span className="text-text-muted text-xs">No recompression, resizing, EXIF stripping, or format conversion.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary block font-medium text-[13px]">Cryptographic Fingerprint</strong>
                    <span className="text-text-muted text-xs">Calculates SHA-256 hash client-side before upload and verifies after download.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-text-primary block font-medium text-[13px]">Automatic Lifecycles</strong>
                    <span className="text-text-muted text-xs">Files are automatically removed immediately after download or after 10 minutes.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="bg-surface-hover hover:bg-surface-elevated text-text-primary font-medium py-1.5 px-4 rounded-lg text-xs transition-colors border border-border-default"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
