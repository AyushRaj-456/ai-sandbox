"use client";

import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import styles from './TerminalPanel.module.css';

export const TerminalPanel: React.FC = () => {
  const { logs, clearLogs } = useProject();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleLogClick = (message: string) => {
    // Regex matching "line 12", "line: 12", "L12", "at line 12"
    const match = message.match(/line\s*(\d+)/i) || message.match(/L\s*(\d+)/i);
    if (match) {
      const lineNum = parseInt(match[1], 10);
      if (!isNaN(lineNum)) {
        window.dispatchEvent(new CustomEvent('editor-jump-to-line', { detail: { line: lineNum } }));
      }
    }
  };

  return (
    <div className={styles.terminal}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Terminal size={14} />
          <span>COMPILER LOGS</span>
        </div>
        <button className={styles.clearBtn} onClick={clearLogs} title="Clear logs">
          <Trash2 size={14} />
        </button>
      </div>
      <div className={`${styles.content} premium-scroll`}>
        {logs.length === 0 ? (
          <div className={styles.empty}>No logs yet. Ready to compile.</div>
        ) : (
          logs.map(log => {
            const hasLineRef = log.message.match(/line\s*(\d+)/i) || log.message.match(/L\s*(\d+)/i);
            return (
              <div 
                key={log.id} 
                className={`${styles.logLine} ${styles[log.type]} ${hasLineRef ? styles.clickableLog : ''}`}
                onClick={() => hasLineRef && handleLogClick(log.message)}
              >
                <span className={styles.timestamp}>
                  [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
                </span>
                <span className={styles.message}>{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
