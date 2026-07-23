"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Download, Settings, Github, LayoutGrid, Terminal, Command, FolderDown } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import styles from './TopMenuBar.module.css';
import { getStoredAuth } from '../utils/firebase';

interface TopMenuBarProps {
  onCompilePptx: () => void;
  isCompiling: boolean;
  onOpenPalette: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  logsCollapsed: boolean;
  onToggleLogs: () => void;
  viewMode: 'landing' | 'workspace';
  onToggleViewMode: (mode: 'landing' | 'workspace') => void;
}

interface MenuItem {
  label: string;
  action?: () => void;
  shortcut?: string;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onCompilePptx,
  isCompiling,
  onOpenPalette,
  sidebarCollapsed,
  onToggleSidebar,
  logsCollapsed,
  onToggleLogs,
  viewMode,
  onToggleViewMode
}) => {
  const { files, addLog } = useProject();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showPublishGuide, setShowPublishGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateAuth = () => {
      setProfile(getStoredAuth());
    };
    updateAuth();
    window.addEventListener('auth-state-changed', updateAuth);
    return () => window.removeEventListener('auth-state-changed', updateAuth);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const triggerExportZip = () => {
      handleExportZip();
    };
    window.addEventListener('ide-trigger-export-zip', triggerExportZip);
    return () => window.removeEventListener('ide-trigger-export-zip', triggerExportZip);
  }, [files]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkGuide = () => {
      if (sessionStorage.getItem('dextranic_publish_guide') === 'true' && viewMode === 'workspace') {
        setShowPublishGuide(true);
      } else {
        setShowPublishGuide(false);
      }
    };

    checkGuide();

    window.addEventListener('dextranic-publish-guide-triggered', checkGuide);
    return () => {
      window.removeEventListener('dextranic-publish-guide-triggered', checkGuide);
    };
  }, [viewMode]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dispatchAction = (eventName: string, detail?: any) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
    setActiveMenu(null);
  };

  const dispatchSnippet = (snippet: string) => {
    dispatchAction('insert-editor-snippet', { snippet });
  };

  const handleExportZip = async () => {
    try {
      addLog('info', 'Compiling workspace to ZIP archive...');
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folderMap = new Map<string, any>();
      
      const getFolderPath = (folder: any): string => {
        const parts = [folder.name];
        let curr = folder;
        while (curr.parentId) {
          const parent = files.find(f => f.id === curr.parentId);
          if (!parent) break;
          parts.unshift(parent.name);
          curr = parent;
        }
        return parts.join('/');
      };

      // 1. Create folders in the zip
      const folders = files.filter(f => f.type === 'folder');
      folders.forEach(f => {
        const path = getFolderPath(f);
        const folderZip = zip.folder(path);
        folderMap.set(f.id, folderZip);
      });

      // 2. Add files
      const zipFiles = files.filter(f => f.type === 'file');
      zipFiles.forEach(file => {
        if (file.content.startsWith('data:')) {
          const base64Data = file.content.substring(file.content.indexOf(',') + 1);
          if (file.parentId && folderMap.has(file.parentId)) {
            folderMap.get(file.parentId).file(file.name, base64Data, { base64: true });
          } else {
            zip.file(file.name, base64Data, { base64: true });
          }
        } else {
          if (file.parentId && folderMap.has(file.parentId)) {
            folderMap.get(file.parentId).file(file.name, file.content);
          } else {
            zip.file(file.name, file.content);
          }
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'DextranicWorkspace.zip';
      link.click();
      addLog('success', 'Workspace exported to ZIP successfully!');
    } catch (err: any) {
      addLog('error', `Failed to export ZIP: ${err.message}`);
    }
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipFile = e.target.files?.[0];
    if (!zipFile) return;

    try {
      addLog('info', `Importing project workspace "${zipFile.name}"...`);
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(zipFile);
      const importedFiles: any[] = [];
      const parentIdMap = new Map<string, string>();
      const folderPaths: string[] = [];

      zip.forEach((relativePath) => {
        if (relativePath.endsWith('/')) {
          folderPaths.push(relativePath.substring(0, relativePath.length - 1));
        } else {
          const parts = relativePath.split('/');
          if (parts.length > 1) {
            for (let i = 1; i < parts.length; i++) {
              const dirPath = parts.slice(0, i).join('/');
              if (!folderPaths.includes(dirPath)) {
                folderPaths.push(dirPath);
              }
            }
          }
        }
      });

      folderPaths.sort((a, b) => a.split('/').length - b.split('/').length);

      folderPaths.forEach(path => {
        const parts = path.split('/');
        const folderName = parts[parts.length - 1];
        const parentPath = parts.slice(0, parts.length - 1).join('/');
        const parentId = parentPath ? parentIdMap.get(parentPath) : null;
        const newFolderId = 'folder-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5);
        importedFiles.push({
          id: newFolderId,
          name: folderName,
          type: 'folder',
          content: '',
          parentId: parentId || null
        });
        parentIdMap.set(path, newFolderId);
      });

      const filePromises: Promise<any>[] = [];
      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;

        const parts = relativePath.split('/');
        const fileName = parts[parts.length - 1];
        const parentPath = parts.slice(0, parts.length - 1).join('/');
        const parentId = parentPath ? parentIdMap.get(parentPath) : null;

        const isBin = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'mp4', 'webm', 'ttf', 'otf', 'woff', 'woff2'].includes(fileName.split('.').pop()?.toLowerCase() || '');

        if (isBin) {
          const p = zipEntry.async('base64').then(base64Data => {
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            let mime = 'image/png';
            if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
            else if (ext === 'svg') mime = 'image/svg+xml';
            else if (ext === 'gif') mime = 'image/gif';
            else if (ext === 'webp') mime = 'image/webp';
            else if (ext === 'mp4') mime = 'video/mp4';
            else if (ext === 'ttf') mime = 'font/ttf';
            else if (ext === 'otf') mime = 'font/otf';

            importedFiles.push({
              id: 'file-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
              name: fileName,
              type: 'file',
              content: `data:${mime};base64,${base64Data}`,
              parentId: parentId || null
            });
          });
          filePromises.push(p);
        } else {
          const p = zipEntry.async('string').then(content => {
            importedFiles.push({
              id: 'file-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
              name: fileName,
              type: 'file',
              content,
              parentId: parentId || null
            });
          });
          filePromises.push(p);
        }
      });

      await Promise.all(filePromises);

      if (importedFiles.length > 0) {
        window.dispatchEvent(new CustomEvent('ide-restore-workspace-files', { detail: { files: importedFiles } }));
      }
    } catch (err: any) {
      addLog('error', `Failed to import ZIP workspace: ${err.message}`);
    }
  };

  const menus: MenuSection[] = [
    {
      label: 'File',
      items: [
        { label: 'New File', action: () => dispatchAction('ide-new-file'), shortcut: 'Ctrl+N' },
        { label: 'New Folder', action: () => dispatchAction('ide-new-folder'), shortcut: 'Ctrl+Shift+N' },
        { label: 'Import Workspace (.zip)', action: () => zipInputRef.current?.click() },
        { label: 'Export Workspace (.zip)', action: handleExportZip },
        { label: 'Export to PPTX', action: onCompilePptx, shortcut: 'Ctrl+E' },
        { label: 'Clear Cache & Reset', action: () => dispatchAction('ide-reset-workspace') }
      ]
    },
    {
      label: 'Insert',
      items: [
        {
          label: 'Slide Block',
          action: () => dispatchSnippet(`slide {
    title: "New Slide Title"
    bullets {
        "Point number one"
        "Point number two"
    }
}\n`),
          shortcut: 'Alt+S'
        },
        {
          label: 'Custom Text Block',
          action: () => dispatchSnippet(`text {
    content: "Custom Styled Text"
    font: "Poppins"
    size: "24"
    color: "#38BDF8"
    align: "center"
}\n`),
          shortcut: 'Alt+T'
        },
        {
          label: 'Monospace Code Block',
          action: () => dispatchSnippet(`code {
    language: "javascript"
    content: "const dextranic = true;"
}\n`),
          shortcut: 'Alt+C'
        },
        {
          label: 'LaTeX Equation Block',
          action: () => dispatchSnippet(`equation {
    formula: "E = mc^2"
}\n`),
          shortcut: 'Alt+E'
        },
        {
          label: 'Diagram Flowchart',
          action: () => dispatchSnippet(`diagram flowchart {
    "Start" -> "Process"
    "Process" -> "End"
}\n`),
          shortcut: 'Alt+D'
        }
      ]
    },
    {
      label: 'View',
      items: [
        { label: 'Toggle Sidebar Explorer', action: onToggleSidebar, shortcut: 'Ctrl+B' },
        { label: 'Toggle Compiler Logs', action: onToggleLogs, shortcut: 'Ctrl+J' },
        { label: 'Split Workspace (Default)', action: () => dispatchAction('ide-view-split') },
        { label: 'Focus Mode (Editor Only)', action: () => dispatchAction('ide-view-editor') },
        { label: 'Preview Only Mode', action: () => dispatchAction('ide-view-preview') },
        { label: 'Toggle Fullscreen Slides', action: () => dispatchAction('ide-toggle-presentation'), shortcut: 'F5' }
      ]
    },
    {
      label: 'Help',
      items: [
        { label: 'IDE Keyboard Cheatsheet', action: () => dispatchAction('ide-open-shortcuts') },
        { label: 'Dextranic DSL Reference', action: () => dispatchAction('ide-open-dsl-help') }
      ]
    }
  ];

  if (isMobile) {
    const workspaceItems: MenuItem[] = [
      { label: 'Download ZIP', action: handleExportZip },
      { label: 'Export PPTX', action: onCompilePptx },
      { label: 'Open Command Palette', action: onOpenPalette }
    ];
    if (profile) {
      workspaceItems.push({
        label: 'Publish to Hub',
        action: () => window.dispatchEvent(new CustomEvent('open-upload-modal'))
      });
    }
    workspaceItems.push({ label: 'View on GitHub', action: () => window.open('https://github.com/AyushRaj-456/Dextranic', '_blank') });

    menus.push({
      label: 'Actions',
      items: workspaceItems
    });
  }

  return (
    <div className={styles.bar} ref={menuRef}>
      <input 
        type="file" 
        ref={zipInputRef} 
        onChange={handleImportZip} 
        accept=".zip" 
        style={{ display: 'none' }} 
      />
      <div className={styles.left}>
        <div 
          className={styles.logoContainer} 
          onClick={() => onToggleViewMode(viewMode === 'landing' ? 'workspace' : 'landing')}
          style={{ cursor: 'pointer' }}
          title={viewMode === 'landing' ? "Enter IDE Workspace" : "Go to Product Dashboard"}
        >
          <Play size={18} className={styles.logoIcon} style={{ transform: viewMode === 'landing' ? 'none' : 'rotate(90deg)', transition: 'transform 0.3s ease' }} />
          <span className={styles.logoText}>DEXTRANIC</span>
          {viewMode === 'workspace' && (
            <span className={styles.logoBadge}>IDE</span>
          )}
        </div>

        {viewMode === 'workspace' && (
          <div className={styles.menusList}>
          {menus.map((menu) => (
            <div key={menu.label} className={styles.menuContainer}>
              <button
                className={`${styles.menuButton} ${activeMenu === menu.label ? styles.active : ''}`}
                onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
              >
                {menu.label}
              </button>

              {activeMenu === menu.label && (
                <div className={`${styles.dropdown} premium-scroll`}>
                  {menu.items.map((item, idx) => (
                    <button
                      key={idx}
                      className={styles.dropdownItem}
                      onClick={item.action}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      <div className={styles.right}>
        <button 
          className={styles.iconBtn} 
          onClick={() => window.open('https://github.com', '_blank')} 
          aria-label="GitHub" 
          title="View on GitHub"
        >
          <Github size={16} />
        </button>

        {viewMode === 'landing' && (
          <button 
            className={styles.aboutLink}
            onClick={() => window.dispatchEvent(new CustomEvent('ide-open-about'))}
            title="Learn more about Dextranic"
          >
            About
          </button>
        )}

        {viewMode === 'landing' ? (
          <button 
            className={styles.compileBtn}
            onClick={() => onToggleViewMode('workspace')}
            title="Open Editor Workspace"
            style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', border: 'none' }}
          >
            <Play size={12} fill="#fff" />
            <span>Start Creating</span>
          </button>
        ) : (
          <>
            <button className={styles.iconBtn} aria-label="Settings" title="IDE Settings">
              <Settings size={16} />
            </button>

            <div className={styles.divider} />

            <button 
              className={styles.actionBtn}
              onClick={onOpenPalette}
              title="Open Command Palette (Ctrl+P)"
            >
              <Command size={14} />
              <span>Palette</span>
            </button>

            <button 
              className={`${styles.actionBtn} ${sidebarCollapsed ? styles.collapsed : ''}`}
              onClick={onToggleSidebar}
              title="Toggle Sidebar (Ctrl+B)"
            >
              <LayoutGrid size={14} />
              <span>Explorer</span>
            </button>

            <button 
              className={`${styles.actionBtn} ${logsCollapsed ? styles.collapsed : ''}`}
              onClick={onToggleLogs}
              title="Toggle Terminal Logs (Ctrl+J)"
            >
              <Terminal size={14} />
              <span>Logs</span>
            </button>

            {profile && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button 
                  type="button"
                  className={`${styles.compileBtn} ${showPublishGuide ? styles.publishPulsing : ''}`} 
                  onClick={() => {
                    if (showPublishGuide) {
                      setShowPublishGuide(false);
                      sessionStorage.removeItem('dextranic_publish_guide');
                    }
                    window.dispatchEvent(new CustomEvent('open-upload-modal'));
                  }}
                  title="Publish active presentation to Dextranic Community Hub"
                  style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', boxShadow: '0 0 12px rgba(236, 72, 153, 0.25)', border: 'none', marginRight: '8px' }}
                >
                  <span>Publish to Hub</span>
                </button>
                {showPublishGuide && (
                  <div className={styles.tooltip}>
                    ✨ Click here when you are ready to publish!
                  </div>
                )}
              </div>
            )}

            <button 
              className={styles.compileBtn} 
              onClick={handleExportZip}
              title="Download Workspace Project ZIP (consisting of all folders, files and code)"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 0 12px rgba(16, 185, 129, 0.25)', border: 'none', marginRight: '8px' }}
            >
              <FolderDown size={14} />
              <span>Download ZIP</span>
            </button>

            <button 
              className={styles.compileBtn} 
              onClick={onCompilePptx}
              disabled={isCompiling}
              title="Download Presentation Slideshow"
            >
              <Download size={14} />
              <span>{isCompiling ? 'Compiling...' : 'Export PPTX'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
