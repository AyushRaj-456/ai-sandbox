import React from 'react';
import { formatBytes } from '../utils/formatters';

export default function StorageMeter({ storageStatus }) {
  if (!storageStatus) return null;

  const { publicAvailableBytes, publicUsedBytes, publicPoolCapacityBytes, usagePercent } = storageStatus;
  const availBytes = publicAvailableBytes !== undefined ? publicAvailableBytes : 0;
  const capacity = publicPoolCapacityBytes || 1073741824; // 1 GB pool
  const usageRatio = Math.min(1, Math.max(0, (capacity - availBytes) / capacity));

  // Color based on pool usage level
  let barColor = 'bg-accent';
  let textColor = 'text-text-primary';
  if (usagePercent > 80) {
    barColor = 'bg-error';
    textColor = 'text-error';
  } else if (usagePercent > 60) {
    barColor = 'bg-amber-400';
    textColor = 'text-amber-400';
  }

  return (
    <div className="w-full max-w-[850px] mx-auto mb-8">
      <div className="bg-surface border border-border-default rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Temporary storage available
          </span>
          <span className={`text-sm font-mono font-semibold ${textColor}`}>
            {formatBytes(availBytes)} available
          </span>
        </div>

        {/* Storage availability bar */}
        <div className="w-full bg-page border border-border-default rounded-full h-2 overflow-hidden mb-2.5">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(usageRatio * 100, 100)}%` }}
          />
        </div>

        <p className="text-[11px] text-text-muted leading-tight">
          Files are stored temporarily and automatically removed after download or after 10 minutes.
        </p>
      </div>
    </div>
  );
}
