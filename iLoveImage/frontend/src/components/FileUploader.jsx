import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, ArrowRight, FileText, X as XIcon } from 'lucide-react';
import { formatBytes, getFileCategory } from '../utils/formatters';

export default function FileUploader({ onFilesSelected, storageStatus }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const MAX_SINGLE_FILE = 100 * 1024 * 1024; // 100 MB per file
  const MAX_FILES = 20;

  const publicAvailableBytes = storageStatus?.publicAvailableBytes ?? (512 * 1024 * 1024);
  const publicPoolCapacityBytes = storageStatus?.publicPoolCapacityBytes ?? (512 * 1024 * 1024);


  // Available percentage calculation against the absolute 1GB total capacity
  const absoluteTotalBytes = 1024 * 1024 * 1024; // 1 GB
  const availPercent = Math.min(100, Math.max(0, Math.round((publicAvailableBytes / absoluteTotalBytes) * 100)));
  const isStorageFull = publicAvailableBytes <= 0;
  const isStorageLow = availPercent < 20 && !isStorageFull;

  // SVG Ring calculation: Radius 48, Circumference ~301.59
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (availPercent / 100) * circumference;

  // Dynamic colors based on availability thresholds
  let ringStrokeColor = '#22C55E'; // green for >= 60%
  if (availPercent < 35) {
    ringStrokeColor = '#EF4444'; // red for < 35%
  } else if (availPercent < 60) {
    ringStrokeColor = '#EAB308'; // amber for 35% - 59%
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isStorageFull) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = (newFiles) => {
    setErrorMsg('');
    if (!newFiles || newFiles.length === 0 || isStorageFull) return;

    const incoming = Array.from(newFiles);
    const combined = [...selectedFiles];

    for (const file of incoming) {
      if (file.size > MAX_SINGLE_FILE) {
        setErrorMsg(`"${file.name}" exceeds the 100 MB per-file limit.`);
        return;
      }
      if (combined.some(f => f.name === file.name && f.size === file.size)) {
        continue;
      }
      combined.push(file);
    }

    if (combined.length > MAX_FILES) {
      setErrorMsg(`Maximum ${MAX_FILES} files per upload session.`);
      return;
    }

    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > publicAvailableBytes) {
      setErrorMsg(`Your selection (${formatBytes(totalSize)}) exceeds the currently available temporary storage (${formatBytes(publicAvailableBytes)}).`);
      return;
    }

    setSelectedFiles(combined);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && !isStorageFull) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && !isStorageFull) {
      processFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setErrorMsg('');
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFiles.length > 0 && !isExceedingStorage) {
      onFilesSelected(selectedFiles);
    }
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
  const isExceedingStorage = totalSize > publicAvailableBytes;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <div className="text-center mb-10 sm:mb-12">
        <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.08em] text-text-muted uppercase mb-4">
          ZERO-COMPRESSION DIRECT TRANSFER
        </p>
        <h1
          className="font-display font-semibold text-text-primary mb-5 leading-[1.08] tracking-tight"
          style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
        >
          Share Original Files
          <br />
          Without Loss
        </h1>
        <p className="text-[17px] sm:text-lg text-text-secondary leading-relaxed max-w-[680px] mx-auto">
          Share original photos and images without compression. Every file is stored byte-for-byte and verified with SHA-256 integrity checks.
        </p>
      </div>

      {/* Main Upload Card — Balanced 2-Column Desktop Layout */}
      <form onSubmit={handleSubmit} className="w-full max-w-[850px]">
        <div
          className={`
            relative rounded-2xl border transition-all duration-200
            grid grid-cols-1 md:grid-cols-[1.35fr_auto_1fr] items-stretch
            ${selectedFiles.length > 0 ? 'cursor-default' : 'cursor-pointer'}
            ${dragActive
              ? 'border-accent bg-accent-subtle'
              : selectedFiles.length > 0
                ? 'border-border-default bg-surface'
                : 'border-border-default bg-surface hover:border-border-accent hover:bg-surface-hover'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => selectedFiles.length === 0 && !isStorageFull && fileInputRef.current?.click()}
        >
          {/* Visually hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleChange}
            accept="image/*,.heic,.heif,.raw,.cr2,.nef,.arw,.dng,.tiff,.tif"
            tabIndex={-1}
            disabled={isStorageFull}
          />

          {/* LEFT SECTION: Existing Upload Interface */}
          <div className="flex flex-col justify-center items-center text-center p-6 sm:p-8">
            {selectedFiles.length === 0 ? (
              /* Empty upload prompt */
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-page border border-border-default flex items-center justify-center text-text-muted mb-4">
                  <Upload className="w-5 h-5" />
                </div>

                <p className="text-lg font-medium text-text-primary mb-1">
                  Drag & drop your files here
                </p>
                <p className="text-xs text-text-muted mb-5">
                  Select original photos or images to share
                </p>

                <button
                  type="button"
                  disabled={isStorageFull}
                  className="h-11 px-6 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isStorageFull) fileInputRef.current?.click();
                  }}
                >
                  Browse files
                </button>

                <p className="text-[11px] text-text-muted mt-5 leading-relaxed">
                  JPEG, PNG, HEIC, TIFF, RAW &middot; Maximum 100 MB per file &middot; Up to 20 files
                </p>
              </div>
            ) : (
              /* Files selected list */
              <div className="w-full text-left" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} &middot; {formatBytes(totalSize)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                    >
                      Add more
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs text-text-muted hover:text-error font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-page border border-border-default"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="text-xs text-text-primary truncate max-w-[180px] sm:max-w-[240px]">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-text-muted font-mono">
                          {formatBytes(file.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-text-muted hover:text-error transition-colors p-0.5"
                          aria-label={`Remove ${file.name}`}
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SUBTLE VERTICAL DIVIDER (horizontal on mobile) */}
          <div className="hidden md:block w-[1px] bg-border-default my-6 self-stretch opacity-60" />
          <div className="block md:hidden h-[1px] bg-border-default mx-6 opacity-60" />

          {/* RIGHT SECTION: Live Circular Storage Ring Meter */}
          <div className="flex flex-col justify-center items-center text-center p-6 sm:p-8 bg-surface-hover/30 rounded-r-2xl">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-4">
              STORAGE AVAILABILITY
            </span>

            {/* Circular SVG Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background track circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="#272729"
                  strokeWidth="7"
                  fill="transparent"
                />
                {/* Available progress ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke={ringStrokeColor}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-[stroke-dashoffset,stroke] duration-700 ease-in-out"
                />
              </svg>

              {/* Percentage centered inside circle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span 
                  className="text-2xl font-bold font-mono tracking-tight transition-colors duration-700 ease-in-out"
                  style={{ color: ringStrokeColor }}
                >
                  {availPercent}%
                </span>
              </div>
            </div>

            {/* Below Circle details */}
            <p className="text-sm font-semibold font-mono text-text-primary mb-0.5">
              {formatBytes(publicAvailableBytes)} available
            </p>
            <p className="text-xs text-text-muted">
              Dynamic storage &middot; Increases as slots free up
            </p>

            {/* Selected batch size indicator */}
            {selectedFiles.length > 0 && (
              <p className={`text-xs font-mono mt-2 font-medium ${isExceedingStorage ? 'text-error' : 'text-accent'}`}>
                Selected: {formatBytes(totalSize)}
              </p>
            )}

            {/* Storage state notices */}
            {isStorageFull ? (
              <div className="mt-3 text-center">
                <p className="text-xs text-error font-semibold">Storage temporarily full</p>
                <p className="text-[11px] text-text-muted mt-0.5 max-w-[200px] leading-tight">
                  Waiting for temporary files to expire or be downloaded.
                </p>
              </div>
            ) : isStorageLow ? (
              <p className="text-[11px] text-amber-400 mt-2 max-w-[200px] leading-tight">
                Storage is currently limited. More space may become available shortly.
              </p>
            ) : null}
          </div>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-error-subtle border border-error/20 text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Expiry note & Upload button */}
        {selectedFiles.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="text-center">
              <p className="text-xs text-text-muted">
                Files are temporary and automatically removed after download or after <span className="text-text-secondary font-medium">10 minutes</span>.
              </p>
            </div>

            <button
              type="submit"
              disabled={isExceedingStorage || isStorageFull}
              className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Calculate SHA-256 & Generate Share Link</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </form>

      {storageStatus && (
        <div className="w-full max-w-[850px] flex justify-end mt-3 px-2">
          <div className="text-[11px] text-text-muted/60 text-right space-y-0.5 font-medium">
            <p>Total images shared: {storageStatus.totalTransfersCompleted?.toLocaleString() || 0}</p>
            <p>Total bytes shared: {formatBytes(storageStatus.totalStorageTransferredBytes || 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
