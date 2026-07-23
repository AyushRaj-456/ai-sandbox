"use client";

import React, { useState } from 'react';
import { X, Pin, PinOff, Search, RotateCcw } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import styles from './EditorTabs.module.css';

export const EditorTabs: React.FC = () => {
  const { files, openTabs, activeFileId, setActiveFile, closeTab, addLog, updateFile } = useProject();
  const [pinnedTabs, setPinnedTabs] = useState<Set<string>>(new Set());
  const [tabOrder, setTabOrder] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Context Menu overlay state
  const [tabMenu, setTabMenu] = useState<{ visible: boolean; x: number; y: number; tabId: string | null }>({
    visible: false,
    x: 0,
    y: 0,
    tabId: null
  });

  if (openTabs.length === 0) return null;

  // Sync tab order if it changes outside
  const orderedTabs = [...openTabs].sort((a, b) => {
    const aPinned = pinnedTabs.has(a);
    const bPinned = pinnedTabs.has(b);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    // Preserve custom order if present
    const indexA = tabOrder.indexOf(a);
    const indexB = tabOrder.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  const togglePin = (tabId: string) => {
    const next = new Set(pinnedTabs);
    if (next.has(tabId)) {
      next.delete(tabId);
      addLog('info', `Unpinned editor tab.`);
    } else {
      next.add(tabId);
      addLog('info', `Pinned editor tab to the left.`);
    }
    setPinnedTabs(next);
    setTabMenu({ visible: false, x: 0, y: 0, tabId: null });
  };

  const handleTabContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setTabMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabId
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setTabMenu({ visible: false, x: 0, y: 0, tabId: null });
  };

  // Drag and Drop Tab Reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('tab-index', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('tab-index');
    if (!sourceIndexStr) return;

    const sourceIndex = parseInt(sourceIndexStr, 10);
    const nextOrder = [...orderedTabs];
    const [movedTab] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, movedTab);

    setTabOrder(nextOrder);
  };

  const filteredTabs = orderedTabs.filter(tabId => {
    const file = files.find(f => f.id === tabId);
    return file?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.tabsWrapper} onClick={closeContextMenu}>
      <div className={styles.tabsContainer}>
        {orderedTabs.map((tabId, idx) => {
          const file = files.find(f => f.id === tabId);
          if (!file) return null;
          const isActive = tabId === activeFileId;
          const isPinned = pinnedTabs.has(tabId);

          return (
            <div 
              key={tabId} 
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              className={`${styles.tab} ${isActive ? styles.active : ''} ${isPinned ? styles.pinned : ''}`}
              onClick={() => setActiveFile(tabId)}
              onContextMenu={(e) => handleTabContextMenu(e, tabId)}
            >
              {isPinned && <Pin size={10} className={styles.pinIcon} />}
              <span className={styles.tabName}>{file.name}</span>
              
              <button 
                className={styles.closeBtn}
                onClick={(e) => { e.stopPropagation(); closeTab(tabId); }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <button 
          className={styles.searchToggle}
          onClick={() => {
            if (activeFileId && window.confirm("Are you sure you want to reset this file? All your unsaved code will be lost.")) {
              const file = files.find(f => f.id === activeFileId);
              if (file && file.type === 'file') {
                 const isMain = file.name === 'main.dex';
                 const defaultContent = isMain 
                   ? "presentation {\n    title: \"Reset Workspace\"\n}\n\nimport \"slides/intro.dex\"\n" 
                   : "slide {\n    title: \"Reset Slide\"\n    bullets {\n        \"First point\"\n    }\n}\n";
                 updateFile(activeFileId, defaultContent);
                 addLog('warning', `Code reset applied to ${file.name}`);
              }
            }
          }}
          title="Reset active file to default"
        >
          <RotateCcw size={12} />
        </button>
        {/* Tab Search Filter trigger button */}
        <button 
          className={styles.searchToggle}
          onClick={() => setSearchOpen(!searchOpen)}
          title="Search opened tabs"
          style={{ marginLeft: '4px' }}
        >
          <Search size={12} />
        </button>
      </div>

      {searchOpen && (
        <div className={styles.searchOverlay}>
          <input
            autoFocus
            type="text"
            placeholder="Type tab name to jump..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.searchResults}>
            {filteredTabs.map(tabId => {
              const f = files.find(file => file.id === tabId);
              if (!f) return null;
              return (
                <div 
                  key={tabId} 
                  className={styles.searchResultRow}
                  onClick={() => {
                    setActiveFile(tabId);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  {f.name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Tab Context Menu */}
      {tabMenu.visible && tabMenu.tabId && (
        <div 
          className={styles.tabMenu} 
          style={{ top: tabMenu.y, left: tabMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className={styles.menuItem} onClick={() => togglePin(tabMenu.tabId!)}>
            {pinnedTabs.has(tabMenu.tabId) ? (
              <>
                <PinOff size={12} />
                <span>Unpin Tab</span>
              </>
            ) : (
              <>
                <Pin size={12} />
                <span>Pin Tab</span>
              </>
            )}
          </button>
          <button className={styles.menuItem} onClick={() => { closeTab(tabMenu.tabId!); closeContextMenu(); }}>
            <X size={12} />
            <span>Close Tab</span>
          </button>
        </div>
      )}
    </div>
  );
};
