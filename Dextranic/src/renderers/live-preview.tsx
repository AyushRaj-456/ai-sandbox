"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PresentationNode, SlideNode, TextNode, ImageNode, VideoNode, BulletsNode } from '../compiler/ast';
import { parseRichText } from '../compiler/rich-text-parser';
import { useProject } from '../context/ProjectContext';
import styles from './LivePreview.module.css';

interface LivePreviewProps {
  ast: PresentationNode | null;
  error: string | null;
  activeFileName?: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ ast, error, activeFileName }) => {
  const { files } = useProject();
  const [zoom, setZoom] = useState<'fit' | 0.5 | 0.75 | 1 | 1.25>('fit');
  const [presentationMode, setPresentationMode] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Dynamically inject custom fonts style tag
  useEffect(() => {
    const styleId = 'live-preview-custom-fonts';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    // Find all custom font files (ttf, otf, woff, woff2) in project workspace
    const fontFiles = files.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['ttf', 'otf', 'woff', 'woff2'].includes(ext || '') && f.content.startsWith('data:');
    });

    let styleContent = '';
    fontFiles.forEach(file => {
      const fontFamilyName = file.name.replace(/\.[^/.]+$/, '');
      styleContent += `
        @font-face {
          font-family: '${fontFamilyName}';
          src: url('${file.content}');
        }
      `;
    });
    
    styleEl.textContent = styleContent;
  }, [files]);

  const resolveAssetSrc = (src: string): string => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return src;
    }
    const normalized = src.replace(/^\.\//, '').replace(/^\//, '');
    
    const getFileFullPath = (f: any): string => {
      const parts = [f.name];
      let curr = f;
      while (curr.parentId) {
        const parent = files.find(p => p.id === curr.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        curr = parent;
      }
      return parts.join('/');
    };

    const file = files.find(f => {
      const full = getFileFullPath(f);
      return full === normalized || f.name === normalized;
    });

    if (file && file.content.startsWith('data:')) {
      return file.content;
    }
    return src;
  };

  const slides = useMemo(() => {
    if (!ast) return [];
    return ast.children.filter((child): child is SlideNode => child.type === 'Slide');
  }, [ast]);

  const theme = useMemo(() => {
    if (!ast) return {};
    return ast.children.find(child => child.type === 'Theme')?.properties || {};
  }, [ast]);

  useEffect(() => {
    const handleToggle = () => setPresentationMode(prev => !prev);
    window.addEventListener('ide-toggle-presentation', handleToggle);
    return () => window.removeEventListener('ide-toggle-presentation', handleToggle);
  }, []);

  useEffect(() => {
    if (!activeFileName || slides.length === 0) return;
    const slideIdx = slides.findIndex(s => s.sourceFile === activeFileName);
    if (slideIdx !== -1) {
      setActiveSlideIndex(slideIdx);
    }
  }, [activeFileName, slides]);

  useEffect(() => {
    if (!presentationMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode, slides.length]);

  const uniqueFonts = useMemo(() => {
    const fonts = new Set<string>();
    if (theme.font) fonts.add(theme.font);
    if (theme.headingFont) fonts.add(theme.headingFont);
    if (theme.bodyFont) fonts.add(theme.bodyFont);

    slides.forEach(slide => {
      slide.children.forEach(child => {
        if (child.type === 'Text' && child.properties.font) {
          fonts.add(child.properties.font);
        }
      });
    });

    const systemFonts = ['sans-serif', 'serif', 'monospace', 'arial', 'helvetica', 'times new roman', 'courier new', 'georgia'];
    return Array.from(fonts).filter(f => !systemFonts.includes(f.toLowerCase()));
  }, [slides, theme]);

  const themeVars = useMemo(() => ({
    '--slide-bg': theme.background || '#ffffff',
    '--slide-color': theme.color || '#000000',
    '--slide-font': theme.font || 'sans-serif',
  }), [theme]) as React.CSSProperties;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Compilation Error</h3>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!ast || slides.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>Write some Dextranic code to see the preview here.</p>
      </div>
    );
  }

  return (
    <div className={styles.container} style={themeVars}>
      {uniqueFonts.map(font => (
        <link key={font} href={`https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;700&display=swap`} rel="stylesheet" />
      ))}
      
      <div className={styles.mainLayout}>
        <div className={styles.previewToolbar}>
          <button className={styles.toolbarButton} onClick={() => {
            setActiveSlideIndex(0);
            setPresentationMode(true);
          }}>
            🖥️ Present Slideshow
          </button>
          
          <div className={styles.zoomContainer}>
            <span className={styles.zoomLabel}>Zoom:</span>
            <select 
              value={zoom} 
              onChange={(e) => setZoom(e.target.value === 'fit' ? 'fit' : parseFloat(e.target.value) as any)}
              className={styles.zoomSelect}
            >
              <option value="fit">Fit Screen</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
            </select>
          </div>
        </div>

        <div className={styles.previewWorkspace}>
          <div className={styles.thumbnailsSidebar}>
            <div className={styles.thumbnailHeader}>
              {ast.properties.title || 'Untitled Presentation'}
            </div>
            {slides.map((slide, i) => (
              <div key={i} className={styles.thumbnail} onClick={() => {
                document.getElementById(`slide-${i}`)?.scrollIntoView({ behavior: 'smooth' });
              }}>
                <span className={styles.thumbnailNumber}>{i + 1}</span>
                <div className={styles.thumbnailPreview}>
                  {slide.properties.title || 'Slide'}
                </div>
              </div>
            ))}
          </div>

          <div className={`${styles.slidesWrapper} premium-scroll`}>
            <div 
              className={styles.scalerContainer} 
              style={zoom !== 'fit' ? { transform: `scale(${zoom})`, transformOrigin: 'top center', height: 'fit-content' } : undefined}
            >
              {slides.map((slide, i) => (
                <SlidePreview key={i} slide={slide} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {presentationMode && (
        <div className={styles.presentationOverlay}>
          <div className={styles.presentationHeader}>
            <span className={styles.presentationCounter}>
              Slide {activeSlideIndex + 1} of {slides.length}
            </span>
            <button 
              className={styles.exitButton} 
              onClick={() => setPresentationMode(false)}
            >
              Exit [ESC]
            </button>
          </div>

          <div className={styles.presentationContent}>
            <SlidePreview slide={slides[activeSlideIndex]} index={activeSlideIndex} />
          </div>

          <div className={styles.presentationNav}>
            <button 
              className={styles.navBtn} 
              onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={activeSlideIndex === 0}
            >
              ◀ Previous
            </button>
            <button 
              className={styles.navBtn} 
              onClick={() => setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
              disabled={activeSlideIndex === slides.length - 1}
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const renderRichText = (str: string) => {
  const runs = parseRichText(str);
  return (
    <>
      {runs.map((run, idx) => {
        const style: React.CSSProperties = {
          fontWeight: run.bold ? 'bold' : 'normal',
          fontStyle: run.italic ? 'italic' : 'normal',
          color: run.color ? `#${run.color}` : 'inherit',
          fontFamily: run.fontFace || 'inherit',
          fontSize: run.fontSize ? `${run.fontSize}pt` : 'inherit'
        };
        return (
          <span key={idx} style={style}>
            {run.text}
          </span>
        );
      })}
    </>
  );
};

const SlidePreview: React.FC<{ slide: SlideNode, index: number }> = ({ slide, index }) => {
  const { files } = useProject();

  const resolveAssetSrc = (src: string): string => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return src;
    }
    const normalized = src.replace(/^\.\//, '').replace(/^\//, '');
    
    const getFileFullPath = (f: any): string => {
      const parts = [f.name];
      let curr = f;
      while (curr.parentId) {
        const parent = files.find(p => p.id === curr.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        curr = parent;
      }
      return parts.join('/');
    };

    const file = files.find(f => {
      const full = getFileFullPath(f);
      return full === normalized || f.name === normalized;
    });

    if (file && file.content.startsWith('data:')) {
      return file.content;
    }
    return src;
  };

  const { properties } = slide;
  const layout = properties.layout || 'standard';
  const meshTheme = properties.mesh;
  const glass = properties.glass === 'true';
  const overlay = properties.overlay === 'true';
  const bg = properties.background || '';
  const typography = properties.typography || 'standard';
  const accent = properties.accent || '#38bdf8';
  const videoBg = properties.video;
  const decorations = properties.decorations || '';
  const bgText = properties.bgText || '';
  const bgTextSize = properties.bgTextSize ? parseInt(properties.bgTextSize) : 0;
  const animateType = properties.animate;

  const slideStyles: any = {};
  let hasBgImage = false;

  if (bg) {
    if (bg.startsWith('http') || bg.startsWith('data:')) {
      hasBgImage = true;
    } else {
      slideStyles.backgroundColor = bg;
    }
  }

  // Determine dark contrast coloring
  const isDark = bg ? ['#0b0f19', '#121214', '#050811', '#030712', '#000000', '#020617', '#0f172a', '#1c0d0d', '#0d1321'].includes(bg.toLowerCase()) : true;
  if (isDark) {
    slideStyles.color = '#f8fafc';
    slideStyles['--slide-color'] = '#f8fafc';
  } else {
    slideStyles.color = '#0f172a';
    slideStyles['--slide-color'] = '#0f172a';
  }

  const accentGlow = accent;
  const accentGlowSec = meshTheme === 'cyberpunk' ? '#ec4899' : '#818cf8';

  const firstImageNode = slide.children.find(child => child.type === 'Image') as ImageNode | undefined;
  const remainingChildren = firstImageNode && (layout === 'split-left' || layout === 'split-right')
    ? slide.children.filter(child => child !== firstImageNode)
    : slide.children;

  let titleClass = styles.slideTitle;
  if (typography === 'cinematic') titleClass = styles.titleCinematic;
  else if (typography === 'outlined') titleClass = styles.titleOutlined;
  else if (typography === 'neon') titleClass = styles.titleNeon;

  const renderDecorations = () => {
    const items = decorations.split(',').map(s => s.trim().toLowerCase());
    return (
      <div className={styles.decorationsLayer}>
        {items.includes('rings') && <div className={styles.floatingRing} />}
        {items.includes('sphere') && <div className={styles.metallicSphere} />}
        {items.includes('grid') && <div className={styles.holoGrid} />}
        {items.includes('ribbon') && <div className={styles.chromeRibbon} />}
      </div>
    );
  };

  const isCinematicZoom = animateType === 'cinematic-zoom';
  const zoomClass = isCinematicZoom ? ` ${styles.cinematicBgZoom}` : '';

  const renderBackground = () => (
    <>
      {videoBg && (
        <>
          <video 
            src={resolveAssetSrc(videoBg)} 
            autoPlay 
            loop 
            muted 
            playsInline 
            className={`${styles.videoBg}${zoomClass}`}
          />
          <div className={styles.videoOverlay} />
        </>
      )}
      {hasBgImage && (
        <>
          <img src={resolveAssetSrc(bg)} alt="Slide Background" className={`${styles.bgImage}${zoomClass}`} />
          {overlay && <div className={styles.darkOverlay} />}
        </>
      )}
      {meshTheme && (
        <div className={styles.meshBg} style={{ 
          '--accent-glow': accentGlow, 
          '--accent-glow-sec': accentGlowSec 
        } as React.CSSProperties}>
          <div className={`${styles.meshBlob} ${styles.meshBlob1}`} />
          <div className={`${styles.meshBlob} ${styles.meshBlob2}`} />
        </div>
      )}
      {decorations && renderDecorations()}
      {bgText && (
        <div 
          className={styles.giantBgText} 
          style={bgTextSize ? { fontSize: `${bgTextSize}px` } : undefined}
        >
          {bgText}
        </div>
      )}
    </>
  );

  const titleNode = slide.properties.title && (
    <h1 className={titleClass} style={{ '--accent-glow': accentGlow } as React.CSSProperties}>
      {renderRichText(slide.properties.title)}
    </h1>
  );

  const renderChildrenContent = () => (
    <div className={styles.slideContent}>
      {remainingChildren.map((child, idx) => {
        if (child.type === 'Bullets') {
          return (
            <ul key={idx} className={styles.bullets}>
              {child.items.map((item, bIdx) => (
                <motion.li 
                  key={bIdx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index * 0.1) + 0.2 + (bIdx * 0.1) }}
                >
                  {renderRichText(item)}
                </motion.li>
              ))}
            </ul>
          );
        }
        if (child.type === 'Image') {
          return (
            <div key={idx} className={styles.imageContainer} style={{ width: child.properties.width || '100%', textAlign: (child.properties.align as any) || 'center' }}>
              <img src={resolveAssetSrc(child.src)} alt="Slide Image" className={styles.image} />
            </div>
          );
        }
        if (child.type === 'Video') {
          return (
            <div key={idx} className={styles.videoContainer}>
              <video src={resolveAssetSrc(child.src)} controls={!child.properties.autoplay} autoPlay={child.properties.autoplay === 'true'} loop muted className={styles.video} />
            </div>
          );
        }
        if (child.type === 'Text') {
          const props = child.properties;
          const style: React.CSSProperties = {
            textAlign: (props.align as any) || 'left',
            fontFamily: props.font || 'inherit',
            fontSize: props.size ? `${props.size}px` : 'inherit',
            color: props.color || 'inherit',
            lineHeight: props.lineHeight || 'inherit',
            padding: props.padding || '0',
            margin: props.margin || '0',
            textTransform: props.uppercase === 'true' ? 'uppercase' : 'none',
            letterSpacing: props.letterSpacing || 'normal',
          };
          
          let shadowValue = '';
          if (props.shadow === 'true') {
            shadowValue += '2px 2px 4px rgba(0,0,0,0.5)';
          }
          if (props.glow) {
            if (shadowValue) shadowValue += ', ';
            shadowValue += `0 0 10px ${props.glow}`;
          }
          if (shadowValue) {
            style.textShadow = shadowValue;
          }

          return (
            <div key={idx} style={style} className={styles.textBlock}>
              {renderRichText(child.text || props.content || '')}
            </div>
          );
        }
        if (child.type === 'Code') {
          const props = child.properties;
          return (
            <div key={idx} className={styles.codeBlockContainer}>
              <div className={styles.codeHeader}>
                <span className={styles.codeDot} />
                <span className={styles.codeDot} />
                <span className={styles.codeDot} />
                <span className={styles.codeLang}>{props.language || 'code'}</span>
              </div>
              <pre className={styles.codePre}>
                <code>{props.content || ''}</code>
              </pre>
            </div>
          );
        }
        if (child.type === 'Equation') {
          const props = child.properties;
          const formula = props.formula || '';
          
          const formatEquation = (eq: string) => {
            let formatted = eq
              .replace(/\^([A-Za-z0-9+-=]+)/g, '<sup>$1</sup>')
              .replace(/_([A-Za-z0-9+-=]+)/g, '<sub>$1</sub>');
            return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
          };

          return (
            <div key={idx} className={styles.equationContainer}>
              <div className={styles.equationFrame}>
                {formatEquation(formula)}
              </div>
            </div>
          );
        }
        if (child.type === 'Diagram') {
          return (
            <div key={idx} className={styles.diagramContainer}>
              {child.edges.map((edge, eIdx) => (
                <React.Fragment key={eIdx}>
                  <div className={styles.diagramNode} style={{ backgroundColor: accent } as React.CSSProperties}>{edge.from}</div>
                  <div className={styles.diagramArrow}>↓</div>
                  {eIdx === child.edges.length - 1 && (
                    <div className={styles.diagramNode} style={{ backgroundColor: accent } as React.CSSProperties}>{edge.to}</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          );
        }
        if (child.type === 'Table') {
          const props = child.properties;
          const headers = props.headers ? props.headers.split(',').map(s => s.trim()) : [];
          const rows = props.rows ? props.rows.split(';').map(row => row.split('|').map(s => s.trim())) : [];
          
          return (
            <div key={idx} className={styles.tableBlockContainer}>
              <table className={styles.previewTable}>
                {headers.length > 0 && (
                  <thead>
                    <tr>
                      {headers.map((h, hIdx) => <th key={hIdx}>{h}</th>)}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (child.type === 'Chart') {
          const props = child.properties;
          const chartType = props.type || 'bar';
          const labels = props.labels ? props.labels.split(',').map(s => s.trim()) : [];
          const data = props.data ? props.data.split(',').map(s => parseFloat(s.trim()) || 0) : [];
          const maxVal = Math.max(...data, 1);
          
          return (
            <div key={idx} className={child.properties.width ? '' : styles.chartBlockContainer} style={{ width: child.properties.width || '100%' }}>
              {props.title && <div className={styles.chartTitle}>{props.title}</div>}
              
              {chartType === 'bar' && (
                <div className={styles.barChartWrapper}>
                  {data.map((val, dIdx) => {
                    const pct = (val / maxVal) * 100;
                    return (
                      <div key={dIdx} className={styles.barColumn}>
                        <div className={styles.barValue}>{val}</div>
                        <div className={styles.barFillContainer}>
                          <motion.div 
                            className={styles.barFill} 
                            style={{ 
                              height: `${pct}%`,
                              background: `linear-gradient(180deg, ${accent} 0%, rgba(2, 132, 199, 0.8) 100%)` 
                            } as React.CSSProperties}
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                          />
                        </div>
                        <div className={styles.barLabel}>{labels[dIdx] || ''}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {chartType === 'line' && (
                <div className={styles.lineChartWrapper}>
                  <svg className={styles.lineChartSvg} viewBox="0 0 500 200">
                    <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
                    <line x1="40" y1="90" x2="480" y2="90" stroke="rgba(255,255,255,0.05)" />
                    <line x1="40" y1="160" x2="480" y2="160" stroke="rgba(255,255,255,0.1)" />
                    
                    {data.length > 1 && (
                      <motion.path 
                        d={data.map((val, dIdx) => {
                          const x = 40 + (dIdx * (440 / (data.length - 1)));
                          const y = 160 - (val / maxVal) * 130;
                          return `${dIdx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke={accent}
                        strokeWidth="3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: 'easeInOut' }}
                      />
                    )}
                    
                    {data.map((val, dIdx) => {
                      const x = 40 + (dIdx * (440 / (data.length - 1)));
                      const y = 160 - (val / maxVal) * 130;
                      return (
                        <g key={dIdx}>
                          <circle cx={x} cy={y} r="5" fill={accent} stroke="#0f172a" strokeWidth="2" />
                          <text x={x} y={y - 10} textAnchor="middle" fill="#f8fafc" fontSize="10">{val}</text>
                          <text x={x} y="180" textAnchor="middle" fill="#64748b" fontSize="10">{labels[dIdx] || ''}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}

              {chartType === 'pie' && (
                <div className={styles.pieChartWrapper}>
                  <svg className={styles.pieChartSvg} viewBox="0 0 200 200">
                    {(() => {
                      let accumAngle = 0;
                      const total = data.reduce((a, b) => a + b, 0);
                      const colors = [accent, '#10b981', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];
                      
                      return data.map((val, dIdx) => {
                        const sliceAngle = (val / total) * 360;
                        const x1 = 100 + 80 * Math.cos((accumAngle - 90) * Math.PI / 180);
                        const y1 = 100 + 80 * Math.sin((accumAngle - 90) * Math.PI / 180);
                        
                        accumAngle += sliceAngle;
                        
                        const x2 = 100 + 80 * Math.cos((accumAngle - 90) * Math.PI / 180);
                        const y2 = 100 + 80 * Math.sin((accumAngle - 90) * Math.PI / 180);
                        
                        const largeArc = sliceAngle > 180 ? 1 : 0;
                        const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
                        
                        return (
                          <path 
                            key={dIdx} 
                            d={pathData} 
                            fill={colors[dIdx % colors.length]} 
                            stroke="#0f172a" 
                            strokeWidth="2"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className={styles.pieLegend}>
                    {data.map((val, dIdx) => {
                      const colors = [accent, '#10b981', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];
                      return (
                        <div key={dIdx} className={styles.legendItem}>
                          <span className={styles.legendDot} style={{ backgroundColor: colors[dIdx % colors.length] }} />
                          <span className={styles.legendText}>{labels[dIdx] || ''}: {val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );

  const renderContentWithLayout = () => {
    if (layout === 'split-left' && firstImageNode) {
      return (
        <div className={`${styles.slideSplit} ${styles.slideContentRelative}`}>
          <div className={styles.splitLeftCol}>
            <div className={styles.visualImageFrame}>
              <img src={resolveAssetSrc(firstImageNode.src)} alt="Slide Visual left" className={styles.visualImage} />
            </div>
          </div>
          <div className={styles.splitRightCol}>
            {titleNode}
            {renderChildrenContent()}
          </div>
        </div>
      );
    }
    if (layout === 'split-right' && firstImageNode) {
      return (
        <div className={`${styles.slideSplit} ${styles.slideContentRelative}`}>
          <div className={styles.splitRightCol}>
            {titleNode}
            {renderChildrenContent()}
          </div>
          <div className={styles.splitLeftCol}>
            <div className={styles.visualImageFrame}>
              <img src={resolveAssetSrc(firstImageNode.src)} alt="Slide Visual right" className={styles.visualImage} />
            </div>
          </div>
        </div>
      );
    }

    let standardLayoutClass = styles.slideContentRelative;
    if (layout === 'asymmetric-left') {
      standardLayoutClass = `${styles.slideContentRelative} ${styles.layoutAsymmetricLeft}`;
    } else if (layout === 'asymmetric-right') {
      standardLayoutClass = `${styles.slideContentRelative} ${styles.layoutAsymmetricRight}`;
    } else if (layout === 'full-hero') {
      standardLayoutClass = `${styles.slideContentRelative} ${styles.layoutFullHero}`;
    }

    const standardLayout = (
      <div className={standardLayoutClass}>
        {titleNode}
        {renderChildrenContent()}
      </div>
    );

    if (glass) {
      return (
        <div className={styles.glassCard}>
          {standardLayout}
        </div>
      );
    }

    return standardLayout;
  };

  const animConfig = animateType === 'blur-reveal'
    ? {
        initial: { opacity: 0, filter: 'blur(16px)', y: 30 },
        animate: { opacity: 1, filter: 'blur(0px)', y: 0 },
        transition: { delay: index * 0.1, duration: 0.8, ease: 'easeOut' }
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: index * 0.1, duration: 0.4 }
      };

  return (
    <motion.div 
      id={`slide-${index}`}
      className={styles.slide}
      style={slideStyles}
      {...animConfig}
    >
      {renderBackground()}
      {renderContentWithLayout()}
    </motion.div>
  );
};

