"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, FilePlus, Play, Trash2, X, Command, EyeOff, Layout } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import styles from './CommandPalette.module.css';

interface CommandItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCompile: () => void;
  onFormat: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onCompile, 
  onFormat 
}) => {
  const { clearLogs, files, setActiveFile } = useProject();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'compile',
      name: 'Export PowerPoint Presentation',
      description: 'Compile active presentation AST into editable native .pptx PowerPoint file',
      icon: <Play size={16} className={styles.iconSuccess} />,
      action: onCompile
    },
    {
      id: 'format',
      name: 'Format Active Document',
      description: 'Standardize indentation, spacing, and brackets format',
      icon: <Layout size={16} className={styles.iconInfo} />,
      action: onFormat,
      shortcut: 'Shift+Alt+F'
    },
    {
      id: 'clear-logs',
      name: 'Clear Terminal Logs',
      description: 'Empty all warnings and success logs in bottom panel',
      icon: <Trash2 size={16} className={styles.iconDanger} />,
      action: clearLogs
    },
    ...files.map(file => ({
      id: `open-${file.id}`,
      name: `Open File: ${file.name}`,
      description: `Switch active tab to editing ${file.name}`,
      icon: <Terminal size={16} className={styles.iconDefault} />,
      action: () => setActiveFile(file.id)
    }))
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Adjust scroll when navigating via arrows
  useEffect(() => {
    if (listRef.current) {
      const activeItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.palette}>
        <div className={styles.searchBar}>
          <Command size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or file to open..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            className={styles.searchInput}
          />
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        <div ref={listRef} className={`${styles.list} premium-scroll`}>
          {filteredCommands.length === 0 ? (
            <div className={styles.noResults}>No matching commands found.</div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <div
                key={cmd.id}
                className={`${styles.item} ${idx === selectedIndex ? styles.active : ''}`}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
              >
                <div className={styles.itemLeft}>
                  {cmd.icon}
                  <div className={styles.itemText}>
                    <div className={styles.itemName}>{cmd.name}</div>
                    <div className={styles.itemDesc}>{cmd.description}</div>
                  </div>
                </div>
                {cmd.shortcut && (
                  <span className={styles.shortcut}>{cmd.shortcut}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
