"use client";

import React, { useState, useEffect } from 'react';
import { ProjectFile } from '../types';
import { useProject } from '../context/ProjectContext';
import { Image, Video, Type, FileCode, Check, Copy } from 'lucide-react';
import styles from './AssetPreview.module.css';

interface AssetPreviewProps {
  file: ProjectFile;
}

export const AssetPreview: React.FC<AssetPreviewProps> = ({ file }) => {
  const { files, addLog } = useProject();
  const [copied, setCopied] = useState(false);
  const [previewText, setPreviewText] = useState('Dextranic Custom Typography Live Preview!');
  
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
  const isVideo = ['mp4', 'webm'].includes(ext);
  const isFont = ['ttf', 'otf', 'woff', 'woff2'].includes(ext);

  // Estimate file size based on base64 content length
  const getFileSize = () => {
    if (!file.content) return '0 KB';
    const base64Length = file.content.length - (file.content.indexOf(',') + 1);
    const padding = (file.content.charAt(file.content.length - 2) === '=') ? 2 : ((file.content.charAt(file.content.length - 1) === '=') ? 1 : 0);
    const bytes = (base64Length * 0.75) - padding;
    const kb = bytes / 1024;
    if (kb > 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${kb.toFixed(1)} KB`;
  };

  // Reconstruct relative full path for display
  const getFileFullPath = (): string => {
    const parts = [file.name];
    let curr = file;
    while (curr.parentId) {
      const parent = files.find(f => f.id === curr.parentId);
      if (!parent) break;
      parts.unshift(parent.name);
      curr = parent;
    }
    return parts.join('/');
  };

  const fullPath = getFileFullPath();
  const fontFamilyName = file.name.replace(/\.[^/.]+$/, ''); // Strip extension for clean font name

  // For custom fonts, dynamically register a local @font-face definition
  useEffect(() => {
    if (isFont && file.content.startsWith('data:')) {
      const styleId = `font-style-${fontFamilyName}`;
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `
        @font-face {
          font-family: '${fontFamilyName}';
          src: url('${file.content}');
        }
      `;
      return () => {
        styleElement?.remove();
      };
    }
  }, [file.id, isFont, file.content, fontFamilyName]);

  // Generate Dextranic DSL shorthand code snippet
  const getDextranicCode = () => {
    if (isImage) {
      return `image {\n    src: "./${fullPath}"\n    width: "400"\n    align: "center"\n}`;
    }
    if (isVideo) {
      return `video {\n    src: "./${fullPath}"\n    width: "600"\n}`;
    }
    if (isFont) {
      return `// Copy this font block into your presentation or slide\nfont {\n    family: "${fontFamilyName}"\n    src: "./${fullPath}"\n}`;
    }
    return `// Reference to file: ./${fullPath}`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getDextranicCode());
    setCopied(true);
    addLog('success', `Copied Dextranic snippet for ${file.name}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertCode = () => {
    const snippet = getDextranicCode();
    // Dispatch caret insertion event to Monaco editor
    window.dispatchEvent(new CustomEvent('insert-editor-snippet', { detail: { snippet } }));
    addLog('success', `Injected Dextranic block for "${file.name}" at caret position!`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.metaInfo}>
          <div className={styles.fileIconWrapper}>
            {isImage && <Image size={24} style={{ color: '#10b981' }} />}
            {isVideo && <Video size={24} style={{ color: '#ec4899' }} />}
            {isFont && <Type size={24} style={{ color: '#eab308' }} />}
            {!isImage && !isVideo && !isFont && <FileCode size={24} />}
          </div>
          <div>
            <h2 className={styles.fileName}>{file.name}</h2>
            <p className={styles.filePath}>./{fullPath} • {getFileSize()}</p>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button className={styles.btnSecondary} onClick={handleCopyCode}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy DSL'}
          </button>
          <button className={styles.btnPrimary} onClick={handleInsertCode}>
            Insert at Caret
          </button>
        </div>
      </div>

      <div className={styles.previewBox}>
        {/* IMAGE PREVIEW */}
        {isImage && file.content.startsWith('data:') && (
          <div className={styles.imagePreviewWrapper}>
            <img src={file.content} alt={file.name} className={styles.imgPreview} />
          </div>
        )}

        {/* VIDEO PREVIEW */}
        {isVideo && file.content.startsWith('data:') && (
          <div className={styles.videoPreviewWrapper}>
            <video src={file.content} controls className={styles.videoPreview} />
          </div>
        )}

        {/* FONT PLAYGROUND */}
        {isFont && (
          <div className={styles.fontPlayground}>
            <div className={styles.fontCard}>
              <span className={styles.cardBadge}>Typographic Sandbox</span>
              <textarea
                className={styles.fontTextarea}
                style={{ fontFamily: `'${fontFamilyName}', sans-serif` }}
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Type custom text to sandbox font properties..."
              />
            </div>
            <div className={styles.fontDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Registered Family:</span>
                <span className={styles.detailVal}>{fontFamilyName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Format:</span>
                <span className={styles.detailVal}>{ext.toUpperCase()}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Dynamic Embedding:</span>
                <span className={styles.detailVal} style={{ color: '#10b981' }}>Active</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.snippetSection}>
        <h3 className={styles.snippetTitle}>Dextranic Shorthand Code</h3>
        <pre className={styles.snippetBlock}>
          <code>{getDextranicCode()}</code>
        </pre>
      </div>
    </div>
  );
};
