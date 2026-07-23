import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function ErrorCard({ error, onGoHome }) {
  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="bg-surface border border-border-default rounded-2xl text-center py-10 px-6">
        <div className="w-11 h-11 mx-auto mb-4 rounded-xl bg-error-subtle border border-error/20 flex items-center justify-center text-error">
          <AlertCircle className="w-5 h-5" />
        </div>

        <h2 className="text-lg font-bold text-text-primary mb-2">
          {error?.title || 'File Link Unavailable'}
        </h2>

        <p className="text-xs text-text-muted mb-6 max-w-xs mx-auto leading-relaxed">
          {error?.message || 'The requested file link could not be found or has expired.'}
        </p>

        <button
          onClick={onGoHome}
          className="bg-surface-hover hover:bg-surface-elevated text-text-secondary font-medium py-2 px-4 rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 border border-border-default"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to iLoveImage Home
        </button>
      </div>
    </div>
  );
}
