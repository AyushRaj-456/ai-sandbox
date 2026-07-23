import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ConnectPlatformModal({ isOpen, onClose, onPlatformSynced }) {
  const [handles, setHandles] = useState({
    codeforces: '',
    leetcode: ''
  });

  const [status, setStatus] = useState({
    codeforces: 'not_connected',
    leetcode: 'not_connected'
  });

  const [loadingPlatform, setLoadingPlatform] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Fetch status & handles from profile
      api.getProfile()
        .then((profile) => {
          if (profile.handles) {
            setHandles({
              codeforces: profile.handles.codeforces || '',
              leetcode: profile.handles.leetcode || ''
            });
          }
        })
        .catch(() => {});

      api.getPlatformStatus()
        .then((res) => {
          if (res) {
            setStatus(res);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSync = async (platform) => {
    const handleValue = handles[platform];
    if (!handleValue.trim()) {
      setErrorMessage(`Please enter a valid ${platform} handle.`);
      return;
    }

    setErrorMessage('');
    setLoadingPlatform(platform);

    try {
      const res = await api.connectPlatform(platform, handleValue);
      setStatus(prev => ({ ...prev, [platform]: 'synced' }));
      setLoadingPlatform(null);
      if (onPlatformSynced) {
        onPlatformSynced();
      }
    } catch (err) {
      setLoadingPlatform(null);
      setErrorMessage(err.message || `Failed to connect ${platform} handle '${handleValue}'.`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      {/* Modal Dialog Box - Codeforces Styling */}
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #b9b9b9',
          borderRadius: '3px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          backgroundColor: '#e1e1e1',
          borderBottom: '1px solid #b9b9b9',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#3b5998' }}>
            → Connect Competitive Platforms
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#555555',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '16px', fontSize: '12px', color: '#222222' }}>
          <p style={{ color: '#555555', marginBottom: '12px', fontSize: '12px' }}>
            Enter your public platform handles to auto-sync contest history & submission logs:
          </p>

          {errorMessage && (
            <div style={{
              padding: '8px 12px',
              marginBottom: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '3px',
              color: '#991b1b',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Codeforces */}
            <div style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', color: '#03a89e' }}>Codeforces</span>
                {status.codeforces === 'synced' ? (
                  <span style={{ fontSize: '10px', color: '#0f8a10', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Synced
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#888888' }}>Not Connected</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. tourist"
                  value={handles.codeforces}
                  onChange={(e) => setHandles({ ...handles, codeforces: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    border: '1px solid #b9b9b9',
                    borderRadius: '2px',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSync('codeforces')}
                  disabled={loadingPlatform === 'codeforces'}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#3b5998',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {loadingPlatform === 'codeforces' ? 'Validating...' : 'Save & Sync'}
                </button>
              </div>
            </div>

            {/* LeetCode */}
            <div style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '3px', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', color: '#ff8c00' }}>LeetCode</span>
                {status.leetcode === 'synced' ? (
                  <span style={{ fontSize: '10px', color: '#0f8a10', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle2 style={{ width: '12px', height: '12px' }} /> Synced
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#888888' }}>Not Connected</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="e.g. alex_codes"
                  value={handles.leetcode}
                  onChange={(e) => setHandles({ ...handles, leetcode: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    border: '1px solid #b9b9b9',
                    borderRadius: '2px',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => handleSync('leetcode')}
                  disabled={loadingPlatform === 'leetcode'}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#3b5998',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {loadingPlatform === 'leetcode' ? 'Syncing...' : 'Save & Sync'}
                </button>
              </div>
            </div>

          </div>

          <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px solid #e1e1e1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '5px 16px',
                backgroundColor: '#e1e1e1',
                border: '1px solid #b9b9b9',
                color: '#222222',
                borderRadius: '2px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
