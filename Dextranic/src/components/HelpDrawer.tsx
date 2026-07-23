"use client";

import React, { useEffect, useState } from 'react';
import styles from './HelpDrawer.module.css';

export const HelpDrawer: React.FC = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showDSLHelp, setShowDSLHelp] = useState(false);

  useEffect(() => {
    const handleOpenShortcuts = () => setShowShortcuts(true);
    const handleOpenDSL = () => setShowDSLHelp(true);

    window.addEventListener('ide-open-shortcuts', handleOpenShortcuts);
    window.addEventListener('ide-open-dsl-help', handleOpenDSL);

    return () => {
      window.removeEventListener('ide-open-shortcuts', handleOpenShortcuts);
      window.removeEventListener('ide-open-dsl-help', handleOpenDSL);
    };
  }, []);

  return (
    <>
      {/* 1. Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className={styles.overlay} onClick={() => setShowShortcuts(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h3>⌨️ IDE Keyboard Shortcuts Cheatsheet</h3>
              <button className={styles.closeBtn} onClick={() => setShowShortcuts(false)}>✕</button>
            </div>
            <div className={styles.content}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Shortcut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Toggle Sidebar Explorer</td>
                    <td><kbd>Ctrl</kbd> + <kbd>B</kbd></td>
                  </tr>
                  <tr>
                    <td>Toggle Compiler Logs</td>
                    <td><kbd>Ctrl</kbd> + <kbd>J</kbd></td>
                  </tr>
                  <tr>
                    <td>New File</td>
                    <td><kbd>Ctrl</kbd> + <kbd>N</kbd></td>
                  </tr>
                  <tr>
                    <td>New Folder</td>
                    <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd></td>
                  </tr>
                  <tr>
                    <td>Autosave Slide State</td>
                    <td><kbd>Ctrl</kbd> + <kbd>S</kbd></td>
                  </tr>
                  <tr>
                    <td>Fuzzy Command Palette</td>
                    <td><kbd>Ctrl</kbd> + <kbd>P</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd></td>
                  </tr>
                  <tr>
                    <td>Toggle Fullscreen Slideshow</td>
                    <td><kbd>F5</kbd></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Dextranic DSL Reference Drawer */}
      {showDSLHelp && (
        <div className={styles.drawerOverlay} onClick={() => setShowDSLHelp(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>▲ Dextranic DSL Language Reference</h3>
              <button className={styles.closeBtn} onClick={() => setShowDSLHelp(false)}>✕</button>
            </div>
            <div className={`${styles.drawerContent} premium-scroll`}>
              <div className={styles.docSection}>
                <h4>Presentation Container</h4>
                <p>Define global title, theme and import dependencies.</p>
                <pre><code>{`presentation {
    title: "Presentation Title"
}
import "slides/intro.dex"`}</code></pre>
              </div>

              <div className={styles.docSection}>
                <h4>Slide Elements</h4>
                <p>Create layout blocks, lists, videos, or flowchart diagrams.</p>
                <pre><code>{`slide {
    title: "Welcome Slide"
    bullets {
        "First standard bullet point"
    }
}`}</code></pre>
              </div>

              <div className={styles.docSection}>
                <h4>Rich Text Control blocks</h4>
                <p>Align, size, color, font-face and apply text shadows inline.</p>
                <pre><code>{`text {
    content: "Advanced Custom Heading"
    font: "Poppins"
    size: "28"
    color: "#38BDF8"
    align: "center"
    shadow: "true"
}`}</code></pre>
              </div>

              <div className={styles.docSection}>
                <h4>LaTeX Inline Formats</h4>
                <p>Nest colors, weights, fonts, sizes, and formulas inline.</p>
                <pre><code>{`"Nest \\bold{bold} or \\color{FF0000}{colored} runs."
"Or markdown **bold**, *italic*, \`inline\` shorthand."`}</code></pre>
              </div>

              <div className={styles.docSection}>
                <h4>Equations & Code blocks</h4>
                <p>Standard math notations and shaded coding terminals.</p>
                <pre><code>{`equation {
    formula: "E = mc^2"
}
code {
    language: "python"
    content: "print('Hello World')"
}`}</code></pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
