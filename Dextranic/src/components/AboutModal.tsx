"use client";

import React, { useEffect, useState } from 'react';
import { 
  Sparkles, Zap, Table, Code, Info, ShieldCheck, 
  Cpu, FileCode, CheckCircle2, XCircle, HeartHandshake, Layers
} from 'lucide-react';
import styles from './AboutModal.module.css';

type TabType = 'intro' | 'features' | 'vs' | 'tech';

export const AboutModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('intro');

  useEffect(() => {
    const handleOpen = () => {
      setActiveTab('intro');
      setIsOpen(true);
    };
    window.addEventListener('ide-open-about', handleOpen);
    return () => {
      window.removeEventListener('ide-open-about', handleOpen);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoTitle}>
            <Sparkles size={18} className={styles.logoIcon} />
            <h3>ABOUT DEXTRANIC</h3>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'intro' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('intro')}
          >
            <Sparkles size={14} />
            <span>Overview</span>
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'features' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <Zap size={14} />
            <span>Innovative Features</span>
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'vs' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('vs')}
          >
            <Table size={14} />
            <span>Dextranic vs PowerPoint</span>
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'tech' ? styles.activeTabBtn : ''}`}
            onClick={() => setActiveTab('tech')}
          >
            <Code size={14} />
            <span>Technical Specs</span>
          </button>
        </div>

        {/* Content Box */}
        <div className={`${styles.content} premium-scroll`}>
          
          {/* TAB 1: INTRODUCTION */}
          {activeTab === 'intro' && (
            <div className={styles.introWrapper}>
              <div className={styles.banner}>
                <div className={styles.bannerTag}>
                  <Sparkles size={10} />
                  <span>PRESENTATION-AS-CODE ERA</span>
                </div>
                <h1 className={styles.bannerTitle}>
                  Program Slides Like <span>Software</span>
                </h1>
                <p className={styles.bannerDesc}>
                  Dextranic is a Next-Generation Presentation-as-Code development IDE that generates fully-editable, native PowerPoint decks using clean programmatic markup instead of tedious manual slide dragging.
                </p>
              </div>

              <div className={styles.introDetailed}>
                <p>
                  As developers and creative engineers, we compile code, manage version control on Git, and construct reusable components. Yet, when designing presentations, we are forced backward: clicking, dragging, aligning text boxes, and manually copying styles across hundreds of static slides.
                </p>
                <p>
                  <strong>Dextranic changes this forever.</strong> By treating presentations as compiled source code, we automate the visual design grid, establish strict layout safety boundaries, and build perfectly-formatted slides in milliseconds.
                </p>
              </div>

              <div className={styles.introHighlights}>
                <div className={styles.highlightItem}>
                  <Zap className={styles.highlightIcon} size={16} />
                  <div className={styles.highlightText}>
                    <h4>Automated Layout Math</h4>
                    <p>Margins, text grids, and hierarchy scaling are calculated programmatically by our render compiler.</p>
                  </div>
                </div>
                <div className={styles.highlightItem}>
                  <ShieldCheck className={styles.highlightIcon} size={16} />
                  <div className={styles.highlightText}>
                    <h4>100% Client-Side Privacy</h4>
                    <p>Compile in Guest Mode. All slide codes are processed offline. No accounts or trackers required.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEATURES */}
          {activeTab === 'features' && (
            <div className={styles.featureWrapper}>
              <div className={styles.featureHeading}>Innovative Features Engineered for Precision</div>
              <div className={styles.featureGrid}>
                
                <div className={styles.featureCard}>
                  <div className={styles.featureCardHeader}>
                    <div className={styles.featIconWrapper}>
                      <Layers size={14} />
                    </div>
                    <h4>Structured DSL Outlining</h4>
                  </div>
                  <p>Declare global theme styles, custom fonts, LaTeX equations, and block containers inside clean, human-readable <code>.dex</code> files.</p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureCardHeader}>
                    <div className={styles.featIconWrapper}>
                      <Cpu size={14} />
                    </div>
                    <h4>Editable PPTX Compilation</h4>
                  </div>
                  <p>Compile shapes directly into vector OpenXML shapes. The resulting PowerPoint download remains 100% fully editable in MS Office, Keynote, or Google Slides.</p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureCardHeader}>
                    <div className={styles.featIconWrapper}>
                      <Code size={14} />
                    </div>
                    <h4>Interactive Live Sandbox</h4>
                  </div>
                  <p>A reactive dual-panel workspace compiling your DSL blocks in real-time. Make code edits and watch slide transformations render on canvas instantly.</p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureCardHeader}>
                    <div className={styles.featIconWrapper}>
                      <Table size={14} />
                    </div>
                    <h4>Rich Built-in Modules</h4>
                  </div>
                  <p>Add complex structures like LaTeX mathematical formulas, responsive animated line/bar charts, multi-row tables, and modular outline folders.</p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: DEXTRANIC VS TRADITIONAL */}
          {activeTab === 'vs' && (
            <div className={styles.comparisonWrapper}>
              <div className={styles.comparisonHeading}>Why Presentation-as-Code is Better</div>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>Traditional PowerPoint</th>
                      <th>Dextranic System</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.rowFeature}>Alignment &amp; Spacing</td>
                      <td className={styles.rowTraditional}>
                        <span className={styles.crossSymbol}>✕</span> Manual, subjective positioning. Constant micro-adjustments for text boxes.
                      </td>
                      <td className={styles.rowDextranic}>
                        <span className={styles.checkSymbol}>✓</span> Automated grid algorithms. Layout parameters adhere to programmatically defined ratios.
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.rowFeature}>Git / Diff Control</td>
                      <td className={styles.rowTraditional}>
                        <span className={styles.crossSymbol}>✕</span> Binary <code>.pptx</code> blobs cannot be versioned, branched, or diffed on Git.
                      </td>
                      <td className={styles.rowDextranic}>
                        <span className={styles.checkSymbol}>✓</span> 100% plain text outline scripts. Seamless branching, pull requests, and commit diffs.
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.rowFeature}>Global Refactoring</td>
                      <td className={styles.rowTraditional}>
                        <span className={styles.crossSymbol}>✕</span> Updating primary hex colors or fonts requires manually recoloring hundreds of slide pages.
                      </td>
                      <td className={styles.rowDextranic}>
                        <span className={styles.checkSymbol}>✓</span> Instantly switch visual themes globally by altering one top-level <code>theme {"{}"}</code> declaration.
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.rowFeature}>Layout Consistency</td>
                      <td className={styles.rowTraditional}>
                        <span className={styles.crossSymbol}>✕</span> Design copy-pasting slowly breaks text boxes, leading to inconsistent slide formatting.
                      </td>
                      <td className={styles.rowDextranic}>
                        <span className={styles.checkSymbol}>✓</span> Compilation models strictly enforce layout constraints, ensuring visual consistency across all slides.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICAL SPECIFICATIONS (README STYLE) */}
          {activeTab === 'tech' && (
            <div className={styles.readmeWrapper}>
              <div className={styles.readmeBlock}>
                <div className={styles.readmeHeading}>
                  <FileCode size={16} />
                  <span>DEXTRANIC_README.md</span>
                </div>

                <div className={styles.readmeSectionTitle}>System Workflow Architecture</div>
                <p className={styles.readmeText}>
                  Under the hood, Dextranic operates using a robust three-stage compiler pipeline that turns developer-centric code outlines into vector presentation elements.
                </p>

                <ol className={styles.readmeList}>
                  <li>
                    <strong>Lexical Tokenization (Lexer):</strong> Evaluates raw <code>.dex</code> script code, segmenting characters into meaningful keyword scopes (e.g. <code>theme</code>, <code>slide</code>, <code>bullets</code>, <code>equation</code>).
                  </li>
                  <li>
                    <strong>Abstract Syntax Tree Parser (AST):</strong> Constructs hierarchical parent-child node maps. During this pass, the semantic analyzer enforces variable validation, theme definitions, and nested block imports.
                  </li>
                  <li>
                    <strong>PPTX OpenXML Code Generator:</strong> Serializes semantic node parameters into highly structured XML zip streams. This utilizes precise position metrics to draw native shapes and text frame runs.
                  </li>
                </ol>

                <div className={styles.readmeSectionTitle}>Syntax Sample Outline</div>
                <pre className={styles.readmePre}>
                  <code className={styles.readmeCode}>
{`theme {
  primary: "#0b0f19"
  secondary: "#38bdf8"
  font: "Outfit"
}

slide {
  title: "Programmable Presentation AST"
  bullets {
    "Write slides using high-level structured syntax"
    "Compile instantly into editable Keynote shapes"
  }
}`}
                  </code>
                </pre>

                <div className={styles.readmeSectionTitle}>IDE Technical Specifications</div>
                <table className={styles.specsTable}>
                  <tbody>
                    <tr>
                      <td className={styles.specsLabel}>Compiler Core</td>
                      <td className={styles.specsValue}>Dextranic Custom Compiler Engine (TypeScript)</td>
                    </tr>
                    <tr>
                      <td className={styles.specsLabel}>UI Architecture</td>
                      <td className={styles.specsValue}>React 18 / Next.js Framework (App Router)</td>
                    </tr>
                    <tr>
                      <td className={styles.specsLabel}>Vector Engine</td>
                      <td className={styles.specsValue}>Native Office OpenXML (OOXML) PresentationML standard</td>
                    </tr>
                    <tr>
                      <td className={styles.specsLabel}>Offline Safe</td>
                      <td className={styles.specsValue}>Strictly Client-side (Local Storage &amp; JSZip packaging)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerText}>
            Dextranic v2.0 — Crafting slide designs with developer precision.
          </div>
          <button className={styles.gotItBtn} onClick={() => setIsOpen(false)}>
            Close About
          </button>
        </div>

      </div>
    </div>
  );
};
