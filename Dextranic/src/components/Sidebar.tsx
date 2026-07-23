"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, Plus, Trash2, Palette, Layout, Presentation, Copy, Edit2, 
  Search, ChevronDown, ChevronRight, FolderPlus, Download, Link, Eye, 
  Layers, Sliders, Code, Upload, RefreshCw, MinusSquare, FolderUp
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { parseOutline, OutlineItem } from '../compiler/outline-parser';
import styles from './Sidebar.module.css';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string | null;
}

export const Sidebar: React.FC = () => {
  const { 
    files, 
    activeFileId, 
    setActiveFile, 
    createFile, 
    createFolder,
    updateFile,
    deleteFile, 
    renameFile, 
    duplicateNode,
    moveFileOrFolder,
    addLog
  } = useProject();

  const activeFile = files.find(f => f.id === activeFileId);

  // States
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'slides'>('explorer');
  const [search, setSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['folder-slides']));
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [isDragOverOS, setIsDragOverOS] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);

  // Inline inputs state
  const [isCreatingFile, setIsCreatingFile] = useState<string | null>(null); // parentId or "root"
  const [isCreatingFolder, setIsCreatingFolder] = useState<string | null>(null); // parentId or "root"
  const [newFileName, setNewFileName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  // Right-click menu state
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null
  });

  // Inline rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(prev => ({ ...prev, visible: false }));
      }
    };
    if (menu.visible) {
      window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [menu.visible]);

  // Parse outline dynamically whenever active file content updates
  useEffect(() => {
    if (activeFile && activeFile.type === 'file') {
      const items = parseOutline(activeFile.content);
      setOutlineItems(items);
    } else {
      setOutlineItems([]);
    }
  }, [activeFile?.content, activeFileId]);

  // Slide deck block actions
  const handleDuplicateSlide = (item: OutlineItem) => {
    if (!activeFile || !item.endLine) return;
    const lines = activeFile.content.split('\n');
    const slideBlock = lines.slice(item.line - 1, item.endLine).join('\n');
    
    // Insert duplicated block right after the original slide block
    lines.splice(item.endLine, 0, '\n' + slideBlock);
    
    updateFile(activeFile.id, lines.join('\n'));
    addLog('success', `Duplicated slide: ${item.name}`);
  };

  const handleDeleteSlide = (item: OutlineItem) => {
    if (!activeFile || !item.endLine) return;
    const lines = activeFile.content.split('\n');
    
    // Remove the slide lines
    lines.splice(item.line - 1, item.endLine - item.line + 1);
    
    updateFile(activeFile.id, lines.join('\n'));
    addLog('warning', `Deleted slide: ${item.name}`);
  };

  const handleToggleHideSlide = (item: OutlineItem) => {
    if (!activeFile || !item.endLine) return;
    const lines = activeFile.content.split('\n');
    const startIdx = item.line - 1;
    const endIdx = item.endLine - 1;
    
    // Check if it's already commented out
    const isCommented = lines[startIdx].trim().startsWith('//');
    
    for (let idx = startIdx; idx <= endIdx; idx++) {
      if (isCommented) {
        // Uncomment
        if (lines[idx].trim().startsWith('//')) {
          lines[idx] = lines[idx].replace(/^\s*\/\/\s?/, '');
        }
      } else {
        // Comment out
        lines[idx] = '// ' + lines[idx];
      }
    }
    
    updateFile(activeFile.id, lines.join('\n'));
    addLog('info', `${isCommented ? 'Unhid' : 'Hid'} slide: ${item.name}`);
  };

  // Collapse all folders
  const handleCollapseAll = () => {
    setExpandedFolders(new Set());
    addLog('info', 'Collapsed all workspace folders.');
  };

  const toggleFolder = (folderId: string) => {
    const next = new Set(expandedFolders);
    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }
    setExpandedFolders(next);
  };

  // Keyboard creation handlers
  const handleCreateFileSubmit = (e: React.FormEvent, parentId: string | null) => {
    e.preventDefault();
    if (newFileName.trim()) {
      createFile(newFileName, '', parentId);
      if (parentId) expandedFolders.add(parentId);
      setNewFileName('');
      setIsCreatingFile(null);
    }
  };

  const handleCreateFolderSubmit = (e: React.FormEvent, parentId: string | null) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName, parentId);
      if (parentId) expandedFolders.add(parentId);
      setNewFolderName('');
      setIsCreatingFolder(null);
    }
  };

  // Drag and Drop (Inside Workspace Tree)
  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.setData('text/plain', nodeId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetParentId: string | null) => {
    e.preventDefault();
    const draggedNodeId = e.dataTransfer.getData('text/plain');
    if (draggedNodeId && draggedNodeId !== targetParentId) {
      moveFileOrFolder(draggedNodeId, targetParentId);
    }
  };

  // Drag and Drop (From Desktop / OS)
  const handleOSDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverOS(true);
  };

  const handleOSDragLeave = () => {
    setIsDragOverOS(false);
  };

  const importSingleFile = (file: File, parentId: string | null): Promise<string> => {
    return new Promise((resolve) => {
      const isDex = file.name.endsWith('.dex');
      if (isDex) {
        file.text().then(content => {
          // Check if file already exists in this folder to avoid duplicates
          const existing = files.find(f => f.name === file.name && f.parentId === parentId);
          if (existing) {
            addLog('warning', `File "${file.name}" already exists in folder.`);
            resolve(existing.id);
            return;
          }
          createFile(file.name, content, parentId);
          addLog('success', `Imported code file: ${file.name}`);
          resolve('');
        });
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const existing = files.find(f => f.name === file.name && f.parentId === parentId);
            if (existing) {
              addLog('warning', `Asset "${file.name}" already exists. Overwriting content.`);
              resolve(existing.id);
              return;
            }
            createFile(file.name, event.target.result.toString(), parentId);
            addLog('success', `Uploaded binary asset: ${file.name}`);
          }
          resolve('');
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleOSDrop = async (e: React.DragEvent, parentId: string | null = null) => {
    e.preventDefault();
    setIsDragOverOS(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        await importSingleFile(file, parentId);
      }
    }
  };

  const handleFilesUploaded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      await importSingleFile(file, null);
    }
  };

  const handleFolderUploaded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    addLog('info', `Parsing and uploading folder items...`);
    
    // Track folder path names mapped to virtual workspace folder IDs
    const pathMap = new Map<string, string>();

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const relPath = file.webkitRelativePath || file.name;
      const parts = relPath.split('/');
      
      let currentParentId: string | null = null;
      let pathAccum = '';

      // Build intermediate folders recursively
      for (let j = 0; j < parts.length - 1; j++) {
        const folderName = parts[j];
        pathAccum = pathAccum ? `${pathAccum}/${folderName}` : folderName;

        if (pathMap.has(pathAccum)) {
          currentParentId = pathMap.get(pathAccum) || null;
        } else {
          // Check if folder node already exists in workspace
          const existing = files.find(
            f => f.type === 'folder' && f.name === folderName && f.parentId === currentParentId
          );

          if (existing) {
            currentParentId = existing.id;
            pathMap.set(pathAccum, existing.id);
          } else {
            // Generate standard unique folder ID
            const newFolderId = 'folder-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5);
            // Inject folder item immediately
            createFolder(folderName, currentParentId);
            // Associate folder
            pathMap.set(pathAccum, newFolderId);
            currentParentId = newFolderId;
          }
        }
      }

      await importSingleFile(file, currentParentId);
    }
  };

  // Right-click menu
  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      nodeId
    });
  };

  const startRename = (nodeId: string, currentName: string) => {
    setRenamingId(nodeId);
    setRenameValue(currentName.replace(/\.dex$/, ''));
    setMenu(prev => ({ ...prev, visible: false }));
  };

  const submitRename = (nodeId: string) => {
    if (renameValue.trim()) {
      renameFile(nodeId, renameValue.trim());
    }
    setRenamingId(null);
  };

  // Custom visual download of .dex file or folder contents
  const handleDownload = (nodeId: string) => {
    const node = files.find(f => f.id === nodeId);
    if (!node) return;

    if (node.type === 'file') {
      const element = document.createElement("a");
      const file = new Blob([node.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = node.name;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      addLog('success', `Downloaded source file: ${node.name}`);
    } else {
      addLog('info', `Downloading folder: Zipping "${node.name}"...`);
    }
    setMenu(prev => ({ ...prev, visible: false }));
  };

  const handleCopyPath = (nodeId: string) => {
    const node = files.find(f => f.id === nodeId);
    if (!node) return;

    // Compute relative workspace path
    const getPathRecursive = (n: any): string => {
      if (n.parentId) {
        const parent = files.find(p => p.id === n.parentId);
        return parent ? `${getPathRecursive(parent)}/${n.name}` : n.name;
      }
      return n.name;
    };

    const fullPath = getPathRecursive(node);
    navigator.clipboard.writeText(fullPath);
    addLog('success', `Copied relative node path: ${fullPath}`);
    setMenu(prev => ({ ...prev, visible: false }));
  };

  const getFileIcon = (fileName: string) => {
    const name = fileName.toLowerCase();
    const ext = name.split('.').pop() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return <Palette size={14} style={{ color: '#10b981' }} />; // emerald green for images
    }
    if (['mp4', 'webm'].includes(ext)) {
      return <Layout size={14} style={{ color: '#ec4899' }} />; // pink for videos
    }
    if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
      return <Code size={14} style={{ color: '#eab308' }} />; // yellow for fonts
    }
    if (name.includes('theme')) return <Palette size={14} className={styles.themeIcon} />;
    if (name.includes('architecture') || name.includes('diagram')) return <Layout size={14} className={styles.diagramIcon} />;
    return <Presentation size={14} className={styles.fileIcon} />;
  };

  // Recursively render folder tree
  const renderTree = (parentId: string | null = null, depth: number = 0) => {
    const currentNodes = files
      .filter(f => f.parentId === parentId)
      .filter(f => search === '' || f.name.toLowerCase().includes(search.toLowerCase()) || f.type === 'folder');

    // Sort folders first, then files alphabetically
    currentNodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div className={styles.treeLevel}>
        {currentNodes.map(node => {
          const isFolder = node.type === 'folder';
          const isExpanded = expandedFolders.has(node.id);

          return (
            <div key={node.id} className={styles.treeNodeWrapper}>
              <div 
                draggable
                onDragStart={(e) => handleDragStart(e, node.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, isFolder ? node.id : node.parentId || null)}
                className={`${styles.treeRow} ${node.id === activeFileId ? styles.active : ''}`}
                style={{ paddingLeft: `${depth * 12 + 16}px` }}
                onClick={() => {
                  if (renamingId !== node.id) {
                    if (isFolder) {
                      toggleFolder(node.id);
                    } else {
                      setActiveFile(node.id);
                    }
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, node.id)}
              >
                <div className={styles.nodeLeft}>
                  {isFolder ? (
                    <span className={styles.arrowIcon}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  ) : (
                    <span className={styles.indentPlaceholder} />
                  )}

                  {isFolder ? (
                    <Folder size={14} className={styles.folderIcon} />
                  ) : (
                    getFileIcon(node.name)
                  )}

                  {renamingId === node.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => submitRename(node.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') submitRename(node.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className={styles.renameInput}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className={styles.nodeName}>{node.name}</span>
                  )}
                </div>

                <div className={styles.nodeRight}>
                  {isFolder && (
                    <>
                      <button 
                        className={styles.inlineBtn}
                        onClick={(e) => { e.stopPropagation(); setIsCreatingFile(node.id); }}
                        title="New File inside folder"
                      >
                        <Plus size={12} />
                      </button>
                      <button 
                        className={styles.inlineBtn}
                        onClick={(e) => { e.stopPropagation(); setIsCreatingFolder(node.id); }}
                        title="New Folder inside folder"
                      >
                        <FolderPlus size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Recursively render children if expanded */}
              {isFolder && isExpanded && (
                <div className={styles.folderContent}>
                  {renderTree(node.id, depth + 1)}

                  {/* Inline creation forms nested under this folder */}
                  {isCreatingFile === node.id && (
                    <form 
                      onSubmit={(e) => handleCreateFileSubmit(e, node.id)} 
                      className={styles.createForm}
                      style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
                    >
                      <Presentation size={14} className={styles.fileIcon} />
                      <input 
                        autoFocus
                        type="text" 
                        value={newFileName}
                        onChange={e => setNewFileName(e.target.value)}
                        onBlur={() => setIsCreatingFile(null)}
                        className={styles.createInput}
                        placeholder="new-file.dex"
                      />
                    </form>
                  )}

                  {isCreatingFolder === node.id && (
                    <form 
                      onSubmit={(e) => handleCreateFolderSubmit(e, node.id)} 
                      className={styles.createForm}
                      style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
                    >
                      <Folder size={14} className={styles.folderIcon} />
                      <input 
                        autoFocus
                        type="text" 
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onBlur={() => setIsCreatingFolder(null)}
                        className={styles.createInput}
                        placeholder="New Folder"
                      />
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className={`${styles.sidebar} ${isDragOverOS ? styles.dragOver : ''}`}
      onDragOver={handleOSDragOver}
      onDragLeave={handleOSDragLeave}
      onDrop={(e) => handleOSDrop(e, null)}
    >
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFilesUploaded} 
        style={{ display: 'none' }} 
      />
      <input 
        type="file" 
        multiple 
        ref={folderInputRef} 
        onChange={handleFolderUploaded} 
        style={{ display: 'none' }} 
        {...{ webkitdirectory: "", directory: "" } as any}
      />

      {/* Tab Switcher */}
      <div className={styles.tabSwitcher}>
        <button 
          className={`${styles.tabBtn} ${activeSidebarTab === 'explorer' ? styles.activeTab : ''}`}
          onClick={() => setActiveSidebarTab('explorer')}
        >
          <Folder size={14} />
          <span>Files</span>
        </button>
        <button 
          className={`${styles.tabBtn} ${activeSidebarTab === 'slides' ? styles.activeTab : ''}`}
          onClick={() => setActiveSidebarTab('slides')}
        >
          <Layers size={14} />
          <span>Slides</span>
        </button>
      </div>

      {activeSidebarTab === 'explorer' && (
        <>
          {/* File Explorer Panel */}
          <div className={styles.explorerSection}>
            <div className={styles.toolbar}>
              <span className={styles.title}>EXPLORER</span>
              <div className={styles.toolbarActions}>
                <button className={styles.iconBtn} onClick={() => setIsCreatingFile('root')} title="New File at Root">
                  <Plus size={14} />
                </button>
                <button className={styles.iconBtn} onClick={() => setIsCreatingFolder('root')} title="New Folder at Root">
                  <FolderPlus size={14} />
                </button>
                <button className={styles.iconBtn} onClick={() => fileInputRef.current?.click()} title="Upload Files">
                  <Upload size={14} />
                </button>
                <button className={styles.iconBtn} onClick={() => folderInputRef.current?.click()} title="Upload Folder">
                  <FolderUp size={14} />
                </button>
                <button className={styles.iconBtn} onClick={handleCollapseAll} title="Collapse All Folders">
                  <MinusSquare size={14} />
                </button>
                <button className={styles.iconBtn} onClick={() => addLog('info', 'Workspace index re-scanned.')} title="Refresh explorer">
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {/* Search Panel Filter */}
            <div className={styles.searchContainer}>
              <Search size={12} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search files..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className={styles.searchInput}
              />
            </div>

            {/* Virtual File tree listing */}
            <div className={styles.fileTree} onDrop={(e) => handleDrop(e, null)} onDragOver={handleDragOver}>
              {renderTree(null, 0)}

              {/* Root-level creation forms */}
              {isCreatingFile === 'root' && (
                <form onSubmit={(e) => handleCreateFileSubmit(e, null)} className={styles.createForm} style={{ paddingLeft: '28px' }}>
                  <Presentation size={14} className={styles.fileIcon} />
                  <input 
                    autoFocus
                    type="text" 
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    onBlur={() => setIsCreatingFile(null)}
                    className={styles.createInput}
                    placeholder="new-file.dex"
                  />
                </form>
              )}

              {isCreatingFolder === 'root' && (
                <form onSubmit={(e) => handleCreateFolderSubmit(e, null)} className={styles.createForm} style={{ paddingLeft: '28px' }}>
                  <Folder size={14} className={styles.folderIcon} />
                  <input 
                    autoFocus
                    type="text" 
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onBlur={() => setIsCreatingFolder(null)}
                    className={styles.createInput}
                    placeholder="New Folder"
                  />
                </form>
              )}
            </div>
          </div>

          {/* Dynamic File Outline Panel */}
          <div className={`${styles.outlineSection} ${!isOutlineOpen ? styles.collapsed : ''}`}>
        <div className={styles.outlineHeader} onClick={() => setIsOutlineOpen(!isOutlineOpen)}>
          <span className={styles.title}>
            {isOutlineOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            OUTLINE
          </span>
          {isOutlineOpen && <span className={styles.badge}>{outlineItems.length} items</span>}
        </div>
        
        {isOutlineOpen && (
          <div className={`${styles.outlineList} premium-scroll`}>
            {outlineItems.length === 0 ? (
              <div className={styles.noOutline}>No slide components detected in active file.</div>
            ) : (
              outlineItems.map(item => (
                <div 
                  key={item.id} 
                  className={styles.outlineRow}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('editor-jump-to-line', { detail: { line: item.line } }));
                  }}
                >
                  {item.type === 'slide' && <Layers size={12} className={styles.slideType} />}
                  {item.type === 'theme' && <Sliders size={12} className={styles.themeType} />}
                  {item.type === 'component' && <Code size={12} className={styles.compType} />}
                  <span className={styles.outlineName}>{item.name}</span>
                  <span className={styles.outlineLine}>L{item.line}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </>
      )}

      {activeSidebarTab === 'slides' && (
        <div className={styles.slidesTabSection}>
          <div className={styles.toolbar}>
            <span className={styles.title}>SLIDE DECK</span>
            <span className={styles.badge}>{outlineItems.filter(i => i.type === 'slide').length} slides</span>
          </div>
          
          <div className={`${styles.slideThumbnailList} premium-scroll`}>
            {outlineItems.filter(i => i.type === 'slide').length === 0 ? (
              <div className={styles.noSlides}>No slides found in the active file.</div>
            ) : (
              outlineItems.filter(i => i.type === 'slide').map((item, idx) => {
                const isHidden = activeFile?.content.split('\n')[item.line - 1]?.trim().startsWith('//');
                
                return (
                  <div 
                    key={item.id} 
                    className={`${styles.slideThumbnailCard} ${isHidden ? styles.hiddenCard : ''}`}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('editor-jump-to-line', { detail: { line: item.line } }));
                    }}
                  >
                    <div className={styles.thumbnailCardHeader}>
                      <span className={styles.slideIndex}>{idx + 1}</span>
                      <span className={styles.slideTitleText}>{item.name}</span>
                    </div>
                    
                    <div className={styles.slideMiniCanvas}>
                      <span className={styles.canvasText}>{item.name || 'Slide Content'}</span>
                    </div>

                    <div className={styles.thumbnailCardActions} onClick={e => e.stopPropagation()}>
                      <button 
                        className={styles.cardActionBtn} 
                        onClick={() => handleToggleHideSlide(item)}
                        title={isHidden ? "Show slide" : "Hide slide"}
                      >
                        <Eye size={12} style={{ color: isHidden ? '#64748b' : '#38bdf8' }} />
                      </button>
                      <button 
                        className={styles.cardActionBtn} 
                        onClick={() => handleDuplicateSlide(item)}
                        title="Duplicate slide"
                      >
                        <Copy size={12} />
                      </button>
                      <button 
                        className={`${styles.cardActionBtn} ${styles.dangerBtn}`} 
                        onClick={() => handleDeleteSlide(item)}
                        title="Delete slide"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* OS File Upload drop Visual Overlay */}
      {isDragOverOS && (
        <div className={styles.uploadOverlay}>
          <Upload size={32} className={styles.uploadIcon} />
          <span className={styles.uploadText}>Drop files here to import into project</span>
        </div>
      )}

      {/* Premium Floating Context Menu */}
      {menu.visible && menu.nodeId && (
        <div 
          ref={menuRef}
          className={styles.contextMenu}
          style={{ top: menu.y, left: menu.x }}
        >
          <button 
            className={styles.menuItem} 
            onClick={() => {
              const node = files.find(f => f.id === menu.nodeId);
              if (node) startRename(node.id, node.name);
            }}
          >
            <Edit2 size={12} />
            <span>Rename</span>
          </button>
          <button 
            className={styles.menuItem} 
            onClick={() => {
              duplicateNode(menu.nodeId!);
              setMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <Copy size={12} />
            <span>Duplicate</span>
          </button>
          <button 
            className={styles.menuItem} 
            onClick={() => handleCopyPath(menu.nodeId!)}
          >
            <Link size={12} />
            <span>Copy Path</span>
          </button>
          <button 
            className={styles.menuItem} 
            onClick={() => handleDownload(menu.nodeId!)}
          >
            <Download size={12} />
            <span>Download</span>
          </button>
          
          <div className={styles.menuDivider} />
          
          <button 
            className={`${styles.menuItem} ${styles.menuDanger}`} 
            onClick={() => {
              deleteFile(menu.nodeId!);
              setMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
