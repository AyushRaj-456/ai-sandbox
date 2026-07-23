import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import HashingProgress from './components/HashingProgress';
import UploadSuccess from './components/UploadSuccess';
import DownloadView from './components/DownloadView';
import { calculateSHA256 } from './utils/hash';
import { createUploadSession, uploadFileToSignedUrl, completeUpload, getStorageStatus } from './utils/api';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash);

  // Workflow state: 'idle' | 'hashing' | 'uploading' | 'success'
  const [uploadStep, setUploadStep] = useState('idle');
  const [currentFileIdx, setCurrentFileIdx] = useState(0);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentFileObj, setCurrentFileObj] = useState(null);

  const [shareData, setShareData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [storageStatus, setStorageStatus] = useState(null);

  // Generate or retrieve a persistent client ID for this browser to track active presence
  const [clientId] = useState(() => {
    let id = localStorage.getItem('ili_client_id');
    if (!id) {
      id = 'visitor_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('ili_client_id', id);
    }
    return id;
  });

  // Authoritative real-time storage status polling (5s interval)
  const fetchStorageInfo = async () => {
    try {
      const data = await getStorageStatus(clientId);
      setStorageStatus(data);
    } catch (err) {
      console.warn('Could not fetch storage status:', err);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
    const interval = setInterval(fetchStorageInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const getFileIdFromRoute = () => {
    if (currentRoute.startsWith('#/f/')) {
      return currentRoute.replace('#/f/', '').trim();
    }
    return null;
  };

  const activeFileId = getFileIdFromRoute();

  const handleStartUpload = async (filesList) => {
    setUploadStep('hashing');
    setErrorMessage('');
    setTotalFilesCount(filesList.length);

    try {
      // Step 1: Web Crypto API SHA-256 calculation for all files
      const preparedFiles = [];
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        setCurrentFileIdx(i);
        setCurrentFileObj(file);
        setCurrentFileProgress(0);

        const hash = await calculateSHA256(file, (pct) => {
          setCurrentFileProgress(pct);
          const currentOverall = Math.round(((i + (pct / 100)) / filesList.length) * 100);
          setOverallProgress(currentOverall);
        });

        preparedFiles.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          hash,
          rawFile: file
        });
      }

      // Step 2: Create session on backend
      setUploadStep('uploading');
      const session = await createUploadSession(preparedFiles);

      // Step 3: Upload raw files to signed URLs
      for (let i = 0; i < preparedFiles.length; i++) {
        const item = preparedFiles[i];
        const signedFileMeta = session.files.find(f => f.filename === item.name) || session.files[i];

        setCurrentFileIdx(i);
        setCurrentFileObj(item.rawFile);
        setCurrentFileProgress(0);

        await uploadFileToSignedUrl(
          signedFileMeta.uploadUrl,
          signedFileMeta.token,
          item.rawFile,
          (pct) => {
            setCurrentFileProgress(pct);
            const currentOverall = Math.round(((i + (pct / 100)) / preparedFiles.length) * 100);
            setOverallProgress(currentOverall);
          }
        );
      }

      // Step 4: Complete upload session
      const completed = await completeUpload(session.sessionId);

      setShareData({
        sessionId: session.sessionId,
        expiresAt: session.expiresAt,
        shareUrl: completed.shareUrl,
        files: preparedFiles
      });

      setUploadStep('success');
      fetchStorageInfo();
    } catch (err) {
      console.error('Upload process failed:', err);
      setErrorMessage(err.message || 'An error occurred during upload. Please try again.');
      setUploadStep('idle');
      fetchStorageInfo();
    }
  };

  const handleReset = () => {
    setUploadStep('idle');
    setShareData(null);
    setErrorMessage('');
    fetchStorageInfo();
  };

  const handleGoHome = () => {
    window.location.hash = '';
    handleReset();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Main content area */}
      <main className="flex-1">
        {/* Spacer: 70-90px between navbar and hero content */}
        <div className="h-[72px] sm:h-[84px]" />

        <div className="page-container">
          {activeFileId ? (
            <DownloadView fileId={activeFileId} onGoHome={handleGoHome} />
          ) : (
            <>
              {errorMessage && (
                <div className="max-w-[850px] mx-auto mb-6 p-3 rounded-lg bg-error-subtle border border-error/20 text-error text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {uploadStep === 'idle' && (
                <FileUploader onFilesSelected={handleStartUpload} storageStatus={storageStatus} />
              )}

              {(uploadStep === 'hashing' || uploadStep === 'uploading') && (
                <HashingProgress
                  step={uploadStep}
                  currentFileIndex={currentFileIdx}
                  totalFiles={totalFilesCount}
                  currentFileName={currentFileObj?.name}
                  currentFileSize={currentFileObj?.size}
                  currentFileProgress={currentFileProgress}
                  overallProgress={overallProgress}
                />
              )}

              {uploadStep === 'success' && shareData && (
                <UploadSuccess shareData={shareData} onReset={handleReset} />
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 sm:mt-28 border-t border-border-subtle py-7">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-text-muted">
            &copy; 2026 iLoveImage
            <span className="hidden sm:inline mx-3 text-border-default">|</span>
            <span className="hidden sm:inline">Original File Sharing</span>
          </p>
          <p className="text-[11px] text-text-muted">
            Powered by Vercel Serverless &middot; Supabase Storage & Postgres
          </p>
        </div>
      </footer>
    </div>
  );
}
