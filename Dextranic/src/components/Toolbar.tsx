"use client";

import React from 'react';
import { Play, Download, Settings, Github } from 'lucide-react';
import styles from './Toolbar.module.css';

interface ToolbarProps {
  onCompilePptx: () => void;
  isCompiling: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onCompilePptx, isCompiling }) => {
  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <Play size={20} color="var(--accent)" />
          <span className={styles.brand}>Dextranic</span>
        </div>
      </div>
      <div className={styles.center}>
        <span className={styles.badge}>v0.1.0 Beta</span>
      </div>
      <div className={styles.right}>
        <button className={styles.iconBtn} aria-label="Settings">
          <Settings size={18} />
        </button>
        <button className={styles.iconBtn} aria-label="GitHub">
          <Github size={18} />
        </button>
        <button 
          className={styles.compileBtn} 
          onClick={onCompilePptx}
          disabled={isCompiling}
        >
          <Download size={16} />
          {isCompiling ? 'Compiling...' : 'Export PPTX'}
        </button>
      </div>
    </div>
  );
};
