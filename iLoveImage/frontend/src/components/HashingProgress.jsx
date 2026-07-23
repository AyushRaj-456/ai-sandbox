import React from 'react';
import { Loader2 } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

export default function HashingProgress({ step, currentFileIndex, totalFiles, currentFileName, currentFileSize, currentFileProgress, overallProgress }) {
  const isHashing = step === 'hashing';

  return (
    <div className="w-full max-w-[520px] mx-auto">
      <div className="bg-surface border border-border-default rounded-2xl text-center py-10 px-6">
        <div className="w-11 h-11 mx-auto mb-5 rounded-xl bg-page border border-border-default flex items-center justify-center text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>

        <h2 className="text-base font-semibold text-text-primary mb-1">
          {isHashing ? 'Calculating SHA-256 Fingerprints...' : 'Uploading Files to Storage...'}
        </h2>

        <p className="text-xs text-accent font-medium mb-1">
          File {currentFileIndex + 1} of {totalFiles}
        </p>

        <p className="text-xs text-text-muted font-mono mb-6 truncate max-w-[320px] mx-auto">
          {currentFileName} ({formatBytes(currentFileSize)})
        </p>

        {/* Current File Progress Bar */}
        <div className="w-full bg-page border border-border-default rounded-full h-2 mb-2 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300 rounded-full"
            style={{ width: `${currentFileProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted font-medium mb-4">
          <span>{isHashing ? 'Web Crypto API' : 'Direct Storage'}</span>
          <span className="font-mono text-text-primary">{currentFileProgress}%</span>
        </div>

        {/* Overall Progress */}
        {totalFiles > 1 && (
          <div className="pt-4 border-t border-border-default">
            <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
              <span>Overall Progress</span>
              <span className="font-mono text-text-primary">{overallProgress}%</span>
            </div>
            <div className="w-full bg-page border border-border-default rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
