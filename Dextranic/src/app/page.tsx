"use client";

import React, { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import homeStyles from './homepage.module.css';
import { 
  ArrowRight, Sparkles, BookOpen, Plus, FolderOpen, History, 
  HelpCircle, Compass, Terminal as TermIcon, Table as TableIcon, 
  BarChart, Layers, AlertCircle, PlayCircle, Settings, CheckCircle2, XCircle, Heart, Download,
  Command, FolderDown, Github, LayoutGrid
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { EditorTabs } from '../components/EditorTabs';
import { Editor } from '../components/Editor';
import { TerminalPanel } from '../components/TerminalPanel';
import { LivePreview } from '../renderers/live-preview';
import { ProjectProvider, useProject } from '../context/ProjectContext';
import { SemanticAnalyzer } from '../compiler/semantic-analyzer';
import { PresentationNode } from '../compiler/ast';
import { compileToPPTX } from '../renderers/pptx-compiler';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle, PanelImperativeHandle as ImperativePanelHandle } from 'react-resizable-panels';
import { CommandPalette } from '../components/CommandPalette';
import { formatDextranicCode } from '../compiler/formatter';
import { TopMenuBar } from '../components/TopMenuBar';
import { HelpDrawer } from '../components/HelpDrawer';
import { AboutModal } from '../components/AboutModal';
import { AssetPreview } from '../components/AssetPreview';
import { isBinaryFile } from '../types';

import { TEMPLATES } from "../data/templates";
import { getStoredAuth, fetchCommunityTemplates, likeCommunityTemplate, trackCommunityDownload } from '../utils/firebase';
import { AuthModal } from '../components/AuthModal';
import { UploadModal } from '../components/UploadModal';
import { ProfileDashboard } from '../components/ProfileDashboard';

const LandingPage: React.FC<{
  onEnterWorkspace: () => void;
  onUseTemplate: (templateFiles: any[], templateName: string) => void;
  files: any[];
  onSelectFile: (id: string) => void;
}> = ({ onEnterWorkspace, onUseTemplate, files, onSelectFile }) => {
  const { addLog } = useProject();
  const [activeShowcaseLine, setActiveShowcaseLine] = useState(0);
  const [playgroundCode, setPlaygroundCode] = useState(`slide {
  title: "Hello Playground!"
  text {
    content: "Edit this code live on the homepage!"
    color: "#38bdf8"
    align: "center"
    size: "22"
  }
  bullets {
    "Reactive live slide transformations"
    "Try adding another point here!"
  }
}`);
  const [playgroundAst, setPlaygroundAst] = useState<any>(null);
  const [activeDocsTab, setActiveDocsTab] = useState<'syntax' | 'components' | 'diagrams' | 'pptx'>('syntax');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null);
  const [hoveredSlideIndex, setHoveredSlideIndex] = useState(0);

  // Auth and Community states
  const [profile, setProfile] = useState<any>(null);
  const [communityDecks, setCommunityDecks] = useState<any[]>([]);
  const [likedDecks, setLikedDecks] = useState<string[]>([]);

  const loadCommunityData = async () => {
    try {
      const decks = await fetchCommunityTemplates();
      setCommunityDecks(decks);
    } catch (err) {
      console.error("Failed to load community templates:", err);
    }
  };

  useEffect(() => {
    const updateAuth = () => {
      setProfile(getStoredAuth());
    };
    updateAuth();
    loadCommunityData();
    
    try {
      const storedLikes = JSON.parse(localStorage.getItem('dextranic_liked_templates') || '[]');
      if (Array.isArray(storedLikes)) setLikedDecks(storedLikes);
    } catch (e) {
      setLikedDecks([]);
    }

    window.addEventListener('auth-state-changed', updateAuth);
    window.addEventListener('community-templates-updated', loadCommunityData);
    return () => {
      window.removeEventListener('auth-state-changed', updateAuth);
      window.removeEventListener('community-templates-updated', loadCommunityData);
    };
  }, []);

  // Cycle hovered template slides
  useEffect(() => {
    if (!hoveredTemplateId) return;
    const interval = setInterval(() => {
      setHoveredSlideIndex(prev => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(interval);
  }, [hoveredTemplateId]);

  // Rotate mockup IDE highlight line
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveShowcaseLine(prev => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Update live playground AST compiler
  useEffect(() => {
    try {
      const analyzer = new SemanticAnalyzer([{ id: 'play', name: 'play.dex', content: playgroundCode, type: 'file' }]);
      const parsed = analyzer.analyze('play.dex', playgroundCode);
      if (parsed) {
        setPlaygroundAst(parsed);
      }
    } catch (e) {
      // Allow user to write unfinished block expressions in playground
    }
  }, [playgroundCode]);

  return (
    <div className={homeStyles.landingContainer}>
      {/* Dynamic Glassmorphic Navigation Bar */}
      <nav className={homeStyles.nav}>
        <div className={homeStyles.navLinks}>
          <a href="#templates-sec" className={homeStyles.navLink}>Templates Outline</a>
          <a href="#docs-sec" className={homeStyles.navLink}>Documentation Reference</a>
          <a href="https://github.com/AyushRaj-456/Dextranic" target="_blank" rel="noreferrer" className={homeStyles.navLink}>GitHub Hub</a>
          
          {/* Dynamic Authenticator profile indicators */}
          {profile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="button"
                className={homeStyles.navCta} 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('dextranic_publish_guide', 'true');
                    window.dispatchEvent(new CustomEvent('dextranic-publish-guide-triggered'));
                  }
                  onEnterWorkspace();
                  addLog?.('info', '✏️ Dextranic Workspace Ready: Create or edit your slides in the editor, then click the highlighted "Publish to Hub" button in the top menu bar to share it!');
                }}
                style={{ backgroundColor: '#ec4899', borderColor: '#ec4899', cursor: 'pointer' }}
              >
                Publish Template
              </button>
              <div 
                onClick={() => window.dispatchEvent(new CustomEvent('open-profile-dashboard'))}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                title="View Creator Dashboard"
              >
                <img 
                  src={profile.avatarUrl} 
                  alt="User Avatar" 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid #38bdf8', padding: '1px' }} 
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>@{profile.username}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="button"
                className={homeStyles.navLink} 
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'signin' } }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign In
              </button>
              <button 
                type="button"
                className={homeStyles.navCta} 
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'signup' } }))}
                style={{ cursor: 'pointer' }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={homeStyles.hero} id="hero-sec">
        <div className={homeStyles.heroTag}>

          <Sparkles size={14} />
          <span>Next-Generation Presentation-as-Code</span>
        </div>
        <h1 className={homeStyles.heroHeading}>
          <span className={homeStyles.rbDextranic}>{'\u201c'}Dextranic{'\u201d'}</span>
          <span className={homeStyles.heroTagline}>Program PowerPoint Presentations<br />Like Software</span>
        </h1>
        <p className={homeStyles.heroSubtitle}>
          Dextranic is a Presentation-as-Code platform that generates fully editable professional PowerPoint decks using structured code instead of manual slide dragging.
        </p>

        <div className={homeStyles.heroButtons}>
          <button className={homeStyles.primaryBtn} onClick={onEnterWorkspace}>
            <span>Start Creating</span>
            <ArrowRight size={16} />
          </button>
          <a href="#templates-sec" className={homeStyles.secondaryBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
            Explore Templates
          </a>
          <a href="#docs-sec" className={homeStyles.secondaryBtn} style={{ textDecoration: 'none', display: 'inline-block' }}>
            Documentation
          </a>
        </div>

        <div className={homeStyles.userStatusArea}>
          <div className={homeStyles.statusIndicatorDot} />
          <span>Local Guest Mode Active (All files saved securely offline)</span>
        </div>
      </section>

      {/* Zero Friction Value Strip */}
      <section className={homeStyles.zeroFrictionStrip}>
        {/* Row 1: Workflow */}
        <div className={homeStyles.zfWorkflowRow}>
          <div className={homeStyles.zfStep}>
            <div className={homeStyles.zfStepNum}>1</div>
            <div className={homeStyles.zfStepBody}>
              <div className={homeStyles.zfStepLabel}>Import</div>
              <div className={homeStyles.zfStepDetail}>Drop a <span className={homeStyles.zfCode}>.zip</span> or start blank</div>
            </div>
          </div>
          <div className={homeStyles.zfConnector}><div className={homeStyles.zfConnectorLine} /></div>
          <div className={homeStyles.zfStep}>
            <div className={homeStyles.zfStepNum}>2</div>
            <div className={homeStyles.zfStepBody}>
              <div className={homeStyles.zfStepLabel}>Write Code</div>
              <div className={homeStyles.zfStepDetail}>Declare slides in <span className={homeStyles.zfCode}>.dex</span> syntax</div>
            </div>
          </div>
          <div className={homeStyles.zfConnector}><div className={homeStyles.zfConnectorLine} /></div>
          <div className={homeStyles.zfStep}>
            <div className={homeStyles.zfStepNum}>3</div>
            <div className={homeStyles.zfStepBody}>
              <div className={homeStyles.zfStepLabel}>Export PPTX</div>
              <div className={homeStyles.zfStepDetail}>One-click native <span className={homeStyles.zfCode}>.pptx</span> download</div>
            </div>
          </div>
          <div className={homeStyles.zfConnector}><div className={homeStyles.zfConnectorLine} /></div>
          <div className={homeStyles.zfStep}>
            <div className={homeStyles.zfStepNum}>4</div>
            <div className={homeStyles.zfStepBody}>
              <div className={homeStyles.zfStepLabel}>Save Project</div>
              <div className={homeStyles.zfStepDetail}>Download <span className={homeStyles.zfCode}>.zip</span> to resume anytime</div>
            </div>
          </div>
        </div>

        {/* Row 2: Zero-friction guarantees */}
        <div className={homeStyles.zfGuaranteeRow}>
          <span className={homeStyles.zfGuaranteeLabel}>Zero friction</span>
          <div className={homeStyles.zfGuaranteeBadge}>
            <span className={homeStyles.zfCheck}>✕</span> No database
          </div>
          <div className={homeStyles.zfGuaranteeBadge}>
            <span className={homeStyles.zfCheck}>✕</span> No login
          </div>
          <div className={homeStyles.zfGuaranteeBadge}>
            <span className={homeStyles.zfCheck}>✕</span> No cloud storage
          </div>
          <div className={homeStyles.zfGuaranteeBadge}>
            <span className={homeStyles.zfCheck}>✕</span> No tracking
          </div>
          <div className={homeStyles.zfGuaranteeBadge}>
            <span className={homeStyles.zfCheck}>✕</span> No account needed
          </div>
        </div>
      </section>

      {/* Live Demo Showcase */}
      <section className={homeStyles.showcaseSection}>
        <div className={homeStyles.showcaseTitle}>
          Visualizing <span>Code → Professional Slide</span> pipeline
        </div>
        <div className={homeStyles.showcaseWindow}>
          <div className={homeStyles.windowHeader}>
            <div className={homeStyles.windowDots}>
              <div className={`${homeStyles.dot} ${homeStyles.dotRed}`} />
              <div className={`${homeStyles.dot} ${homeStyles.dotYellow}`} />
              <div className={`${homeStyles.dot} ${homeStyles.dotGreen}`} />
            </div>
            <div className={homeStyles.windowTitle}>presentation_outline.dex</div>
            <div style={{ width: 40 }} />
          </div>

          <div className={homeStyles.showcaseEditor}>
            <div className={activeShowcaseLine === 0 ? homeStyles.highlightLine : ''}>
              <span className={homeStyles.editorKeyword}>theme</span> {"{"}
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span className={homeStyles.editorProp}>primary:</span> <span className={homeStyles.editorString}>"#0f172a"</span>,
            </div>
            <div style={{ paddingLeft: 16 }}>
              <span className={homeStyles.editorProp}>font:</span> <span className={homeStyles.editorString}>"Outfit"</span>
            </div>
            <div>{"}"}</div>
            <br />
            <div className={activeShowcaseLine === 1 ? homeStyles.highlightLine : ''}>
              <span className={homeStyles.editorKeyword}>slide</span> {"{"}
            </div>
            <div style={{ paddingLeft: 16 }} className={activeShowcaseLine === 2 ? homeStyles.highlightLine : ''}>
              <span className={homeStyles.editorProp}>title:</span> <span className={homeStyles.editorString}>"Dextranic Design Pillars"</span>
            </div>
            <div style={{ paddingLeft: 16 }} className={activeShowcaseLine === 3 ? homeStyles.highlightLine : ''}>
              <span className={homeStyles.editorKeyword}>bullets</span> {"{"}
            </div>
            <div style={{ paddingLeft: 32 }}>
              <span className={homeStyles.editorString}>"Reproducible Slide Outlines"</span>
            </div>
            <div style={{ paddingLeft: 32 }}>
              <span className={homeStyles.editorString}>"High performance local builds"</span>
            </div>
            <div style={{ paddingLeft: 16 }}>{"}"}</div>
            <div>{"}"}</div>
          </div>

          <div className={homeStyles.showcasePreview}>
            <div className={homeStyles.mockSlide}>
              <div className={homeStyles.mockTitle}>
                {activeShowcaseLine >= 2 ? "Dextranic Design Pillars" : "Untitled Slide"}
              </div>
              <div className={homeStyles.mockBullets}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 4, height: 4, background: '#38bdf8', borderRadius: '50%' }} />
                  <span>Reproducible Slide Outlines</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 4, height: 4, background: '#38bdf8', borderRadius: '50%' }} />
                  <span>High performance local builds</span>
                </div>
              </div>
              <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: '0.65rem', color: '#64748b' }}>
                Page 1 of 1
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start & Recent Dashboard */}
      <section className={homeStyles.quickActionsSection}>
        <h2 className={homeStyles.sectionHeading}>Get Started Immediately</h2>
        <div className={homeStyles.sectionSub}>Create new slide sets, browse prebuilt outlines, or resume previous projects</div>
        <div className={homeStyles.actionsGrid}>
          <div className={homeStyles.actionCard} onClick={onEnterWorkspace}>
            <div className={homeStyles.actionIcon}><Plus size={18} /></div>
            <div className={homeStyles.actionTitle}>Create New Project</div>
            <div className={homeStyles.actionDesc}>Initialize an empty workspace and start coding custom presentations instantly.</div>
          </div>
          <a href="#templates-sec" className={homeStyles.actionCard} style={{ textDecoration: 'none' }}>
            <div className={homeStyles.actionIcon}><Compass size={18} /></div>
            <div className={homeStyles.actionTitle}>Browse Templates</div>
            <div className={homeStyles.actionDesc}>Use expert pre-styled decks for sales pitches, academic reviews, or architecture portfolios.</div>
          </a>
          <div className={homeStyles.actionCard} onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.zip';
            input.onchange = () => {
              addLog?.('success', 'Importing custom presentation ZIP archive...');
              onEnterWorkspace();
            };
            input.click();
          }}>
            <div className={homeStyles.actionIcon}><FolderOpen size={18} /></div>
            <div className={homeStyles.actionTitle}>Import ZIP Project</div>
            <div className={homeStyles.actionDesc}>Drop or select pre-exported Dextranic project zip folders straight to workspace.</div>
          </div>
          <div className={homeStyles.actionCard} onClick={onEnterWorkspace}>
            <div className={homeStyles.actionIcon}><History size={18} /></div>
            <div className={homeStyles.actionTitle}>Continue as Guest</div>
            <div className={homeStyles.actionDesc}>Skip accounts setup and continue editing active offline projects securely.</div>
          </div>
        </div>
      </section>

      {/* Recent Projects Dashboard */}
      {files.length > 0 && (
        <section className={homeStyles.recentProjectsSection}>
          <h2 className={homeStyles.sectionHeading} style={{ fontSize: '1.4rem', marginBottom: 24, textAlign: 'left' }}>
            Recent Workspace Files
          </h2>
          <div className={homeStyles.projectsTableContainer}>
            <table className={homeStyles.projectsTable}>
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Workspace Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.slice(0, 5).map(file => (
                  <tr key={file.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{file.name}</td>
                    <td>{file.name.endsWith('.dex') ? 'Dextranic Source' : 'Asset Resource'}</td>
                    <td><span style={{ color: '#10b981' }}>● Active Local State</span></td>
                    <td>
                      <button className={homeStyles.openProjectBtn} onClick={() => {
                        onSelectFile(file.id);
                        onEnterWorkspace();
                      }}>
                        Open in IDE
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Templates Gallery */}
      <section className={homeStyles.templatesSection} id="templates-sec">
        <h2 className={homeStyles.sectionHeading}>{selectedCategory === 'Community Hub' ? 'Dextranic Community Creations Hub' : 'Starter Outlines Gallery'}</h2>
        <div className={homeStyles.sectionSub}>
          {selectedCategory === 'Community Hub' 
            ? 'Browse, clone and star premium presentation systems published by creators globally!' 
            : 'Jumpstart your design with fully compiled developer and academic boilerplate decks'}
        </div>
        
        {/* Category tabs */}
        <div className={homeStyles.categoryTabs}>
          {['All', 'Community Hub', 'Startup Pitch', 'Tech & Data', 'Academic & Formal', 'Creative Keynote'].map(cat => (
            <button
              key={cat}
              type="button"
              className={`${homeStyles.categoryTabBtn} ${selectedCategory === cat ? homeStyles.activeCategoryTab : ''}`}
              onClick={() => setSelectedCategory(cat)}
              style={{
                borderColor: cat === 'Community Hub' ? 'rgba(236, 72, 153, 0.4)' : 'rgba(255,255,255,0.08)',
                color: cat === 'Community Hub' && selectedCategory !== 'Community Hub' ? '#ec4899' : ''
              }}
            >
              {cat === 'Community Hub' ? '🚀 Community Hub' : cat}
            </button>
          ))}
        </div>

        {selectedCategory === 'Community Hub' ? (
          <div className={homeStyles.templatesGrid}>
            {communityDecks.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                padding: '48px',
                textAlign: 'center',
                color: '#64748b',
                fontStyle: 'italic',
                border: '1.5px dashed rgba(255,255,255,0.05)',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.005)'
              }}>
                No community presentation templates have been published yet. Be the first to share one!
              </div>
            ) : (
              communityDecks.map(deck => (
                <div key={deck.templateId} className={homeStyles.templateCard}>
                  <div 
                    className={homeStyles.templateVisual} 
                    style={{ 
                      backgroundImage: `url(${deck.thumbnailUrl})`, 
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center', 
                      position: 'relative',
                      height: '180px'
                    }}
                  >
                    {/* Creator avatar tag overlay */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '100px',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <img 
                        src={deck.creatorAvatar} 
                        alt="Creator" 
                        style={{ width: '18px', height: '18px', borderRadius: '50%' }} 
                      />
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f8fafc' }}>@{deck.creatorName}</span>
                    </div>

                    <div className={homeStyles.slideCountBadge} style={{ backgroundColor: 'rgba(236, 72, 153, 0.85)' }}>
                      {deck.files.length} Files
                    </div>
                  </div>
                  <div className={homeStyles.templateBody} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '160px' }}>
                    <div className={homeStyles.templateTitle} style={{ fontSize: '0.95rem', fontWeight: 800 }}>{deck.title}</div>
                    <p className={homeStyles.templateDesc} style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '6px 0 12px' }}>{deck.description}</p>
                    
                    {/* Tags */}
                    {deck.tags && deck.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                        {deck.tags.map((tag: string, idx: number) => (
                          <span key={idx} style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            color: '#a78bfa',
                            backgroundColor: 'rgba(167, 139, 250, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', gap: '20px', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span 
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s', color: likedDecks.includes(deck.templateId) ? '#ec4899' : 'inherit' }}
                          onClick={async () => {
                            if (likedDecks.includes(deck.templateId)) {
                              addLog?.('info', 'You have already liked this template!');
                              return;
                            }
                            const newLiked = [...likedDecks, deck.templateId];
                            setLikedDecks(newLiked);
                            localStorage.setItem('dextranic_liked_templates', JSON.stringify(newLiked));
                            
                            await likeCommunityTemplate(deck.templateId);
                            loadCommunityData();
                          }}
                          onMouseEnter={(e) => !likedDecks.includes(deck.templateId) && (e.currentTarget.style.color = '#ec4899')}
                          onMouseLeave={(e) => !likedDecks.includes(deck.templateId) && (e.currentTarget.style.color = '')}
                          title={likedDecks.includes(deck.templateId) ? "You liked this" : "Like this template"}
                        >
                          <Heart size={14} style={{ color: likedDecks.includes(deck.templateId) ? '#ec4899' : 'currentColor', fill: likedDecks.includes(deck.templateId) ? '#ec4899' : 'none' }} /> {deck.likes}
                        </span>
                        <span 
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all 0.2s' }}
                          onClick={async () => {
                            try {
                              const JSZip = (await import('jszip')).default;
                              const zip = new JSZip();
                              
                              deck.files.forEach((f: any) => {
                                zip.file(f.name, f.content);
                              });
                              
                              const content = await zip.generateAsync({ type: 'blob' });
                              const url = URL.createObjectURL(content);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${deck.title.replace(/\\s+/g, '_')}_Dextranic.zip`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              
                              addLog?.('success', `Downloading ZIP archive for ${deck.title}...`);
                              await trackCommunityDownload(deck.templateId);
                              loadCommunityData();
                            } catch (e) {
                              console.error("Failed to download zip", e);
                            }
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#38bdf8'}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                          title="Download as ZIP project"
                        >
                          <Download size={14} style={{ color: '#38bdf8' }} /> {deck.downloads}
                        </span>
                      </div>
                      <button 
                        type="button"
                        className={homeStyles.useTemplateBtn}
                        style={{ margin: 0, marginLeft: 'auto', padding: '6px 16px', background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', border: 'none', width: 'auto', fontSize: '0.8rem' }}
                        onClick={() => {
                          const formattedFiles = deck.files.map((f: any, idx: number) => ({
                            id: `file-comm-${idx}-${Math.random().toString(36).substring(2, 5)}`,
                            name: f.name,
                            type: 'file',
                            content: f.content,
                            parentId: null
                          }));
                          onUseTemplate(formattedFiles, deck.title);
                        }}
                      >
                        Clone Deck
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={homeStyles.templatesGrid}>
            {TEMPLATES.filter(tmpl => {
              if (selectedCategory === 'All') return true;
              const categoryMap: Record<string, string> = {
                'pitch': 'Startup Pitch',
                'ai-startup': 'Startup Pitch',
                'architecture': 'Tech & Data',
                'future-tech': 'Tech & Data',
                'dashboard': 'Tech & Data',
                'academic': 'Academic & Formal',
                'proposal': 'Academic & Formal',
                'conference': 'Academic & Formal',
                'minimal': 'Creative Keynote',
                'launch': 'Creative Keynote',
                'portfolio': 'Creative Keynote',
                'marketing': 'Creative Keynote'
              };
              return categoryMap[tmpl.id] === selectedCategory;
            }).map(tmpl => (
              <div key={tmpl.id} className={homeStyles.templateCard}>
                <div 
                  className={homeStyles.templateVisual}
                  onMouseEnter={() => {
                    setHoveredTemplateId(tmpl.id);
                    setHoveredSlideIndex(0);
                  }}
                  onMouseLeave={() => {
                    setHoveredTemplateId(null);
                  }}
                >
                  {hoveredTemplateId === tmpl.id ? (
                    <div className={homeStyles.hoverPreviewSlideshow}>
                      <div className={homeStyles.miniSlide} style={{
                        background: tmpl.id === 'academic' || tmpl.id === 'minimal' ? '#ffffff' : '#0d1321',
                        color: tmpl.id === 'academic' || tmpl.id === 'minimal' ? '#0f172a' : '#f8fafc'
                      }}>
                        <div className={homeStyles.miniSlideTitle}>
                          {tmpl.files[hoveredSlideIndex + 1]?.name.replace('.dex', '').toUpperCase()}
                        </div>
                        <div className={homeStyles.miniSlideProgress}>
                          Slide {hoveredSlideIndex + 1} of {tmpl.files.length - 1}
                        </div>
                        <div className={homeStyles.miniSlideBody}>
                          {hoveredSlideIndex === 0 && "⚡ Cover Presentation Layer"}
                          {hoveredSlideIndex === 1 && "⚠️ Strategic Problem Breakdown"}
                          {hoveredSlideIndex === 2 && "⚙️ Deep Core Specifications"}
                          {hoveredSlideIndex === 3 && "📊 Financials & Value Metrics"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={homeStyles.templateVisualTitle}>{tmpl.title}</div>
                      <div className={homeStyles.templateVisualSubtitle} style={{ color: tmpl.id === 'academic' || tmpl.id === 'minimal' ? '#1e3a8a' : '#22d3ee' }}>
                        theme: {tmpl.id === 'academic' || tmpl.id === 'minimal' ? 'clean light' : 'premium dark'}
                      </div>
                    </>
                  )}
                </div>
                <div className={homeStyles.templateBody}>
                  <div className={homeStyles.templateTitle}>{tmpl.title}</div>
                  <p className={homeStyles.templateDesc}>{tmpl.desc}</p>
                  <button 
                    type="button"
                    className={homeStyles.useTemplateBtn} 
                    onClick={() => onUseTemplate(tmpl.files, tmpl.title)}
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* visual How Dextranic Works pipeline flow */}
      <section className={homeStyles.howItWorksSection}>
        <h2 className={homeStyles.sectionHeading}>Visual Compiler Lifecycle</h2>
        <div className={homeStyles.sectionSub}>How structured Dextranic tokens transform into native editable Microsoft Office shapes</div>

        <div className={homeStyles.diagramContainer}>
          <div className={homeStyles.diagramStep}>
            <div className={homeStyles.stepIcon}>1</div>
            <div className={homeStyles.stepName}>.dex Code</div>
            <div className={homeStyles.stepDetail}>Write outlines with modular component scopes</div>
          </div>
          <div className={homeStyles.diagramArrow}>→</div>
          <div className={homeStyles.diagramStep}>
            <div className={homeStyles.stepIcon}>2</div>
            <div className={homeStyles.stepName}>Lexer/Parser</div>
            <div className={homeStyles.stepDetail}>Lexical analyzer maps scopes to AST trees</div>
          </div>
          <div className={homeStyles.diagramArrow}>→</div>
          <div className={homeStyles.diagramStep}>
            <div className={homeStyles.stepIcon}>3</div>
            <div className={homeStyles.stepName}>Compiler Engine</div>
            <div className={homeStyles.stepDetail}>Validates AST declarations and handles schemas</div>
          </div>
          <div className={homeStyles.diagramArrow}>→</div>
          <div className={homeStyles.diagramStep}>
            <div className={homeStyles.stepIcon}>4</div>
            <div className={homeStyles.stepName}>Editable PPTX</div>
            <div className={homeStyles.stepDetail}>Exports native, fully-formatted vector presentations</div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className={homeStyles.featuresSection}>
        <h2 className={homeStyles.sectionHeading}>Built for Creative Engineers</h2>
        <div className={homeStyles.sectionSub}>Dextranic brings professional modern software development workflows straight to presentations</div>

        <div className={homeStyles.featuresGrid}>
          <div className={homeStyles.featureCard}>
            <div className={homeStyles.featureIcon}><Plus size={16} /></div>
            <div className={homeStyles.featureTitle}>Presentation-as-Code</div>
            <div className={homeStyles.featureDesc}>Declare themes, layout parameters, alignments, and formulas inside code. Save hours spent alignments.</div>
          </div>
          <div className={homeStyles.featureCard}>
            <div className={homeStyles.featureIcon}><ArrowRight size={16} /></div>
            <div className={homeStyles.featureTitle}>Native Editable PPTX</div>
            <div className={homeStyles.featureDesc}>Compiles directly into genuine Microsoft vector elements. Open and modify any shapes inside Keynote or PowerPoint.</div>
          </div>
          <div className={homeStyles.featureCard}>
            <div className={homeStyles.featureIcon}><FolderOpen size={16} /></div>
            <div className={homeStyles.featureTitle}>Multi-file Projects</div>
            <div className={homeStyles.featureDesc}>Import logo assets, fonts, layouts, stylesheets, or JSON configs. Maintain clean file separations.</div>
          </div>
          <div className={homeStyles.featureCard}>
            <div className={homeStyles.featureIcon}><Layers size={16} /></div>
            <div className={homeStyles.featureTitle}>Rich Typography Engine</div>
            <div className={homeStyles.featureDesc}>Specify fonts, alignments, scaling parameters, and dark/light color balances to ensure visual excellence.</div>
          </div>
          <div className={homeStyles.featureCard}>
            <div className={homeStyles.featureIcon}><TableIcon size={16} /></div>
            <div className={homeStyles.featureTitle}>Interactive Charts</div>
            <div className={homeStyles.featureDesc}>Renders clean diagrams, LaTeX mathematical equations, comparisons tables, and responsive animated SVG charts.</div>
          </div>
          <div className={homeStyles.featureCard}>
            <div className={homeStyles.featureIcon}><Compass size={16} /></div>
            <div className={homeStyles.featureTitle}>Portable ZIP workspaces</div>
            <div className={homeStyles.featureDesc}>Easily bundle and download your complete local workspace folders, source code, and assets to a single ZIP.</div>
          </div>
        </div>
      </section>

      {/* Interactive Live Playground */}
      <section className={homeStyles.playgroundSection}>
        <h2 className={homeStyles.sectionHeading}>Interactive Sandbox</h2>
        <div className={homeStyles.sectionSub}>Modify Dextranic DSL declarations below and watch slide rendering transform instantly</div>
        
        <div className={homeStyles.playgroundGrid}>
          <div className={homeStyles.playgroundCodeArea}>
            <div className={homeStyles.playgroundLabel}>
              <TermIcon size={14} />
              <span>DEXTRANIC LIVE DSL EDITOR</span>
            </div>
            <textarea 
              className={homeStyles.playgroundTextarea} 
              value={playgroundCode}
              onChange={(e) => setPlaygroundCode(e.target.value)}
              placeholder="slide { title: 'Dextranic Playground' }"
            />
          </div>
          <div className={homeStyles.playgroundPreviewArea}>
            <div className={homeStyles.playgroundLabel}>
              <Layers size={14} />
              <span>REAL-TIME PRESENTATION CANVAS PREVIEW</span>
            </div>
            <div className={homeStyles.playgroundMockSlide}>
              <LivePreview ast={playgroundAst} error={null} activeFileName="playground.dex" />
            </div>
          </div>
        </div>
      </section>

      {/* Documentation portal section */}
      <section className={homeStyles.docsSection} id="docs-sec">
        <h2 className={homeStyles.sectionHeading}>Dextranic Documentation Portal</h2>
        <div className={homeStyles.sectionSub}>Reference standard slide blocks syntax, components, equation rules and theme values</div>

        <div className={homeStyles.docsGrid}>
          <div className={homeStyles.docsSidebar}>
            <button 
              className={`${homeStyles.docsNavBtn} ${activeDocsTab === 'syntax' ? homeStyles.activeDocsNav : ''}`}
              onClick={() => setActiveDocsTab('syntax')}
            >
              Slide Block Syntax
            </button>
            <button 
              className={`${homeStyles.docsNavBtn} ${activeDocsTab === 'components' ? homeStyles.activeDocsNav : ''}`}
              onClick={() => setActiveDocsTab('components')}
            >
              Rich Components
            </button>
            <button 
              className={`${homeStyles.docsNavBtn} ${activeDocsTab === 'diagrams' ? homeStyles.activeDocsNav : ''}`}
              onClick={() => setActiveDocsTab('diagrams')}
            >
              Diagrams & Flowcharts
            </button>
            <button 
              className={`${homeStyles.docsNavBtn} ${activeDocsTab === 'pptx' ? homeStyles.activeDocsNav : ''}`}
              onClick={() => setActiveDocsTab('pptx')}
            >
              PowerPoint Compiler
            </button>
          </div>
          <div className={homeStyles.docsBody}>
            {activeDocsTab === 'syntax' && (
              <>
                <div className={homeStyles.docsTitle}>Basic Slide Syntax</div>
                <p className={homeStyles.docsText}>
                  Outlines in Dextranic consist of a global theme definition block followed by multiple sequential slide blocks. Slides contain custom elements like title texts, list groups, images, and custom grid sections.
                </p>
                <pre className={homeStyles.docsCodeBlock}>
{`theme {
  primary: "#0f172a"
  font: "Outfit"
}

slide {
  title: "First Programmatic Slide"
  text {
    content: "Minimalist slide layout"
    align: "center"
  }
}`}
                </pre>
              </>
            )}

            {activeDocsTab === 'components' && (
              <>
                <div className={homeStyles.docsTitle}>Rich Text, Tables & Bullet lists</div>
                <p className={homeStyles.docsText}>
                  Use standard components inside your slide scopes to build visual content. Supports highly customized headers tables, bullet lists and LaTeX algebra equations.
                </p>
                <pre className={homeStyles.docsCodeBlock}>
{`slide {
  title: "Math & Metrics"
  bullets {
    "Bullet point one"
    "Bullet point two"
  }
  equation {
    formula: "a^2 + b^2 = c^2"
  }
}`}
                </pre>
              </>
            )}

            {activeDocsTab === 'diagrams' && (
              <>
                <div className={homeStyles.docsTitle}>Flowcharts, Connectors & Charts</div>
                <p className={homeStyles.docsText}>
                  Write nodes connectors to declare clean flowchart diagrams. Charts take custom types ("bar", "line", "pie"), titles, labels list, and dataset arrays.
                </p>
                <pre className={homeStyles.docsCodeBlock}>
{`slide {
  title: "Systems Diagram & Chart"
  diagram flowchart {
    "A" -> "B"
    "B" -> "C"
  }
  chart {
    type: "bar"
    title: "Q3 Performance"
    labels: "Q1, Q2, Q3"
    data: "45, 60, 85"
  }
}`}
                </pre>
              </>
            )}

            {activeDocsTab === 'pptx' && (
              <>
                <div className={homeStyles.docsTitle}>Exporting to Native PPTX Elements</div>
                <p className={homeStyles.docsText}>
                  When clicking "Export PPTX", the Dextranic parser converts the layout tree directly into pure PowerPoint shapes. This ensures your fonts, custom vector shapes, native tables and native chart shapes stay completely editable in PowerPoint, Keynote and Google Slides.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Philosophical Comparison Section */}
      <section className={homeStyles.philosophySection}>
        <h2 className={homeStyles.sectionHeading}>Why Presentation-as-Code?</h2>
        <div className={homeStyles.sectionSub}>Compare manual slide creators against modern programmatic design systems</div>

        <div className={homeStyles.comparisonGrid}>
          <div className={homeStyles.comparisonCol}>
            <div className={`${homeStyles.colHeading} ${homeStyles.colHeadingRed}`}>
              <XCircle size={20} />
              <span>Manual Drag-and-Drop Editors</span>
            </div>
            <div className={homeStyles.compList}>
              <div className={homeStyles.compItem}>
                <div className={homeStyles.compLabel}>Inconsistent Margins</div>
                <div className={homeStyles.compDesc}>Slight alignment discrepancies lead to amateur-looking presentations across decks.</div>
              </div>
              <div className={homeStyles.compItem}>
                <div className={homeStyles.compLabel}>No Version Control</div>
                <div className={homeStyles.compDesc}>Merging and tracking changes between multiple PPTX version binary files is impossible.</div>
              </div>
              <div className={homeStyles.compItem}>
                <div className={homeStyles.compLabel}>High Refactoring Costs</div>
                <div className={homeStyles.compDesc}>Updating primary slide theme styling requires manually re-coloring hundreds of text boxes.</div>
              </div>
            </div>
          </div>

          <div className={homeStyles.comparisonCol}>
            <div className={`${homeStyles.colHeading} ${homeStyles.colHeadingGreen}`}>
              <CheckCircle2 size={20} />
              <span>Dextranic Programmable System</span>
            </div>
            <div className={homeStyles.compList}>
              <div className={homeStyles.compItem}>
                <div className={homeStyles.compLabel}>Strict Modular Rules</div>
                <div className={homeStyles.compDesc}>Margins, font hierarchies and typography grids are calculated programmatically.</div>
              </div>
              <div className={homeStyles.compItem}>
                <div className={homeStyles.compLabel}>Full Git Compatibility</div>
                <div className={homeStyles.compDesc}>Presentation source codes are plain-text documents. Track diffs, branches, and commits easily.</div>
              </div>
              <div className={homeStyles.compItem}>
                <div className={homeStyles.compLabel}>Reusable Templates</div>
                <div className={homeStyles.compDesc}>Toggle color schemes globally using simple single theme block properties.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Future Ecosystem marketplace box */}
      <section className={homeStyles.ecosystemSection}>
        <div className={homeStyles.ecosystemBox}>
          <div className={homeStyles.ecoHeading}>Dextranic Ecosystem &amp; Hub</div>
          <p className={homeStyles.ecoDesc}>
            Join the community sharing reusable custom components, premium design themes, plugins, and custom visual templates for programmable slide creations.
          </p>
          <div className={homeStyles.badgeContainer}>
            <span className={homeStyles.ecoBadge}>Plugins Hub (Coming Soon)</span>
            <span className={homeStyles.ecoBadge}>Themes Marketplace</span>
            <span className={homeStyles.ecoBadge}>Enterprise Cloud Sync</span>
          </div>
        </div>
      </section>

      {/* Developer Footer */}
      <footer className={homeStyles.footer}>
        <div className={homeStyles.footerGrid}>
          <div className={homeStyles.footerBrand}>
            <div className={homeStyles.brandName}>DEXTRANIC</div>
            <div className={homeStyles.brandDesc}>
              A next-generation Presentation-as-Code creative IDE for developer and professional team decks.
            </div>
          </div>
          <div className={homeStyles.footerCol}>
            <div className={homeStyles.footerColHeading}>Resources</div>
            <a href="#docs-sec" className={homeStyles.footerLink}>Documentation</a>
            <a href="#templates-sec" className={homeStyles.footerLink}>Templates Outline</a>
            <a href="#hero-sec" className={homeStyles.footerLink}>Playground Sandbox</a>
          </div>
          <div className={homeStyles.footerCol}>
            <div className={homeStyles.footerColHeading}>Community</div>
            <a href="https://github.com/AyushRaj-456/Dextranic" target="_blank" rel="noopener noreferrer" className={homeStyles.footerLink}>GitHub Hub</a>
            <a href="https://github.com/AyushRaj-456/Dextranic#roadmap" target="_blank" rel="noopener noreferrer" className={homeStyles.footerLink}>Roadmap Hub</a>
            <a href="https://github.com/AyushRaj-456/Dextranic#ecosystem" className={homeStyles.footerLink}>Ecosystem Hub</a>
          </div>
          <div className={homeStyles.footerCol}>
            <div className={homeStyles.footerColHeading}>Creator</div>
            <span className={homeStyles.footerCreatorName}>Ayush</span>
            <a href="https://github.com/AyushRaj-456" target="_blank" rel="noopener noreferrer" className={homeStyles.footerLink}>GitHub Profile</a>
            <a href="https://github.com/AyushRaj-456" target="_blank" rel="noopener noreferrer" className={homeStyles.footerLink}>Portfolio</a>
          </div>
        </div>
        <div className={homeStyles.footerBottom}>
          <div>{'©'} {new Date().getFullYear()} Dextranic {'—'} Designed {'&'} Built by <span className={homeStyles.footerAuthor}>Ayush</span>. All rights reserved.</div>
          <div>Crafted with precision in React / Next.js</div>
        </div>
      </footer>
    </div>
  );
};

const Workspace = () => {
  const { files, activeFileId, updateFile, addLog, createFile, createFolder, setActiveFile, loadProjectFiles } = useProject();
  const [ast, setAst] = useState<PresentationNode | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [loadingTemplateName, setLoadingTemplateName] = useState('');

  const activeFile = files.find(f => f.id === activeFileId);

  const sidebarRef = useRef<ImperativePanelHandle>(null);
  const logsRef = useRef<ImperativePanelHandle>(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logsCollapsed, setLogsCollapsed] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [viewMode, setViewMode] = useState<'landing' | 'workspace'>('landing');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<'explorer' | 'editor' | 'preview' | 'logs'>('editor');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Flawless browser back/forward history integration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check URL on first load
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'ide') {
      setViewMode('workspace');
    }

    // 2. Handle back/forward popstate events
    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      if (currentParams.get('mode') === 'ide') {
        setViewMode('workspace');
      } else {
        setViewMode('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3. Keep URL query parameters in sync with React view state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const currentMode = params.get('mode');
    
    if (viewMode === 'workspace' && currentMode !== 'ide') {
      window.history.pushState({ mode: 'ide' }, '', '?mode=ide');
    } else if (viewMode === 'landing' && currentMode === 'ide') {
      window.history.pushState({ mode: 'landing' }, '', window.location.pathname);
    }
  }, [viewMode]);

  const toggleSidebar = () => {
    const panel = sidebarRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const toggleLogs = () => {
    const panel = logsRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  const handleFormatActive = () => {
    if (activeFile) {
      const formatted = formatDextranicCode(activeFile.content);
      updateFile(activeFile.id, formatted);
      addLog('success', `Formatted active document: ${activeFile.name}`);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + B (Toggle Sidebar)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl + J (Toggle Logs)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleLogs();
      }
      // Ctrl + Shift + P (Toggle Command Palette)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      // Ctrl + P (Quick Open files)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      // Ctrl + Shift + N (New Folder)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createFolder('New Folder', null);
      }
      // Ctrl + N (New File)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        createFile('untitled.dex', '', null);
      }
      // Ctrl + S (Autosave feedback)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        addLog('success', 'Workspace autosaved successfully!');
      }
      // Shift + Alt + F (Format Active Document)
      if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFormatActive();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, files]);

  useEffect(() => {
    const handleNewFile = () => createFile('untitled.dex', '', null);
    const handleNewFolder = () => createFolder('New Folder', null);
    const handleExport = () => handleCompilePptx();
    const handleReset = async () => {
      const { clearWorkspace } = await import('../utils/storage');
      await clearWorkspace();
      localStorage.removeItem('dextranic_files_v2');
      window.location.reload();
    };
    const handleToggleSidebar = () => toggleSidebar();
    const handleToggleLogs = () => toggleLogs();
    const handleViewSplit = () => setLayoutMode('split');
    const handleViewEditor = () => setLayoutMode('editor');
    const handleViewPreview = () => setLayoutMode('preview');

    window.addEventListener('ide-new-file', handleNewFile);
    window.addEventListener('ide-new-folder', handleNewFolder);
    window.addEventListener('ide-export-pptx', handleExport);
    window.addEventListener('ide-reset-workspace', handleReset);
    window.addEventListener('ide-toggle-sidebar', handleToggleSidebar);
    window.addEventListener('ide-toggle-logs', handleToggleLogs);
    window.addEventListener('ide-view-split', handleViewSplit);
    window.addEventListener('ide-view-editor', handleViewEditor);
    window.addEventListener('ide-view-preview', handleViewPreview);

    return () => {
      window.removeEventListener('ide-new-file', handleNewFile);
      window.removeEventListener('ide-new-folder', handleNewFolder);
      window.removeEventListener('ide-export-pptx', handleExport);
      window.removeEventListener('ide-reset-workspace', handleReset);
      window.removeEventListener('ide-toggle-sidebar', handleToggleSidebar);
      window.removeEventListener('ide-toggle-logs', handleToggleLogs);
      window.removeEventListener('ide-view-split', handleViewSplit);
      window.removeEventListener('ide-view-editor', handleViewEditor);
      window.removeEventListener('ide-view-preview', handleViewPreview);
    };
  }, [ast, activeFileId, files]);

  useEffect(() => {
    if (!activeFile) {
      setAst(null);
      return;
    }

    try {
      const analyzer = new SemanticAnalyzer(files);
      const semanticAst = analyzer.analyze(activeFile.name, activeFile.content);
      setAst(semanticAst);
    } catch (err: any) {
      addLog('error', err.message);
    }
  }, [activeFile?.content, files.length]);

  const handleCompilePptx = async () => {
    if (!ast) {
      addLog('error', 'Cannot compile: No valid AST found.');
      return;
    }
    setIsCompiling(true);
    addLog('info', 'Starting PPTX compilation...');
    try {
      await compileToPPTX(ast);
      addLog('success', 'Successfully exported Dextranic_Presentation.pptx');
    } catch (err: any) {
      addLog('error', `Compilation failed: ${err.message}`);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleUseTemplate = (templateFiles: any[], templateName: string) => {
    setIsLoadingTemplate(true);
    setLoadingTemplateName(templateName);
    
    setTimeout(() => {
      loadProjectFiles(templateFiles);
      addLog('success', `Successfully initialized template project: ${templateName}`);
      setViewMode('workspace');
      setIsLoadingTemplate(false);
    }, 1200);
  };

  return (
    <main className={styles.main}>
      <TopMenuBar 
        onCompilePptx={handleCompilePptx}
        isCompiling={isCompiling}
        onOpenPalette={() => setIsPaletteOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        logsCollapsed={logsCollapsed}
        onToggleLogs={toggleLogs}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
      />
      
      {viewMode === 'landing' ? (
        <LandingPage 
          onEnterWorkspace={() => setViewMode('workspace')} 
          onUseTemplate={handleUseTemplate}
          files={files}
          onSelectFile={setActiveFile}
        />
      ) : (
        <div className={styles.ideLayout} style={isMobile ? { flexDirection: 'column' } : {}}>
          {isMobile ? (
            <>
              {/* Premium Mobile Workspace Quick-Actions Navigation Bar */}
              <div className={styles.mobileSubNav}>
                <button 
                  type="button" 
                  className={styles.mobileToolbarBtn}
                  onClick={() => setIsPaletteOpen(true)}
                  title="Open Command Palette"
                >
                  <Command size={13} />
                  <span>Palette</span>
                </button>

                <button 
                  type="button" 
                  className={`${styles.mobileToolbarBtn} ${mobileActivePanel === 'explorer' ? styles.active : ''}`}
                  onClick={() => setMobileActivePanel('explorer')}
                  title="Open Sidebar Explorer"
                >
                  <LayoutGrid size={13} />
                  <span>Explorer</span>
                </button>

                <button 
                  type="button" 
                  className={`${styles.mobileToolbarBtn} ${mobileActivePanel === 'logs' ? styles.active : ''}`}
                  onClick={() => setMobileActivePanel('logs')}
                  title="Open Compiler Logs"
                >
                  <TermIcon size={13} />
                  <span>Logs</span>
                </button>

                <button 
                  type="button" 
                  className={`${styles.mobileToolbarBtn} ${styles.mobileDownloadBtn}`}
                  onClick={() => window.dispatchEvent(new CustomEvent('ide-trigger-export-zip'))}
                  title="Download Workspace ZIP"
                >
                  <FolderDown size={13} />
                  <span>Download ZIP</span>
                </button>

                <button 
                  type="button" 
                  className={`${styles.mobileToolbarBtn} ${styles.mobileExportBtn}`}
                  onClick={handleCompilePptx}
                  disabled={isCompiling}
                  title="Export Slides to PPTX"
                >
                  <Download size={13} />
                  <span>{isCompiling ? 'Compiling...' : 'Export PPTX'}</span>
                </button>

                <div className={styles.mobileToolbarDivider} />

                <button 
                  type="button" 
                  className={styles.mobileToolbarIconBtn}
                  onClick={() => window.open('https://github.com/AyushRaj-456/Dextranic', '_blank')}
                  title="View on GitHub"
                >
                  <Github size={13} />
                </button>

                <button 
                  type="button" 
                  className={styles.mobileToolbarIconBtn}
                  onClick={() => alert("IDE Settings are optimized automatically. Use a desktop browser for full customization.")}
                  title="IDE Settings"
                >
                  <Settings size={13} />
                </button>
              </div>

              {mobileActivePanel === 'explorer' && (
                <div className={styles.editorOnlyContainer} style={{ height: 'calc(100vh - 140px)' }}>
                  <Sidebar />
                </div>
              )}
              {mobileActivePanel === 'editor' && (
                <div className={styles.editorOnlyContainer} style={{ height: 'calc(100vh - 140px)' }}>
                  <div className={styles.centerPanel}>
                    <EditorTabs />
                    <div className={styles.editorWrapper}>
                      {activeFile ? (
                        isBinaryFile(activeFile.name) ? (
                          <AssetPreview file={activeFile} />
                        ) : (
                          <Editor 
                            path={activeFile.id}
                            value={activeFile.content} 
                            onChange={(val) => updateFile(activeFile.id, val || '')} 
                          />
                        )
                      ) : (
                        <div className={styles.emptyEditor}>
                          <p>Select a file from the explorer to start editing.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {mobileActivePanel === 'preview' && (
                <div className={styles.previewOnlyContainer} style={{ height: 'calc(100vh - 140px)' }}>
                  <LivePreview ast={ast} error={null} activeFileName={activeFile?.name} />
                </div>
              )}
              {mobileActivePanel === 'logs' && (
                <div className={styles.editorOnlyContainer} style={{ height: 'calc(100vh - 140px)' }}>
                  <TerminalPanel />
                </div>
              )}
              
              {/* Premium Mobile Bottom Workspace Switcher */}
              <div className={styles.mobileTabSelector}>
                <button 
                  type="button"
                  className={`${styles.mobileTabBtn} ${mobileActivePanel === 'explorer' ? styles.active : ''}`}
                  onClick={() => setMobileActivePanel('explorer')}
                >
                  <FolderOpen size={16} />
                  <span>Explorer</span>
                </button>
                <button 
                  type="button"
                  className={`${styles.mobileTabBtn} ${mobileActivePanel === 'editor' ? styles.active : ''}`}
                  onClick={() => setMobileActivePanel('editor')}
                >
                  <Sparkles size={16} />
                  <span>Editor</span>
                </button>
                <button 
                  type="button"
                  className={`${styles.mobileTabBtn} ${mobileActivePanel === 'preview' ? styles.active : ''}`}
                  onClick={() => setMobileActivePanel('preview')}
                >
                  <PlayCircle size={16} />
                  <span>Preview</span>
                </button>
                <button 
                  type="button"
                  className={`${styles.mobileTabBtn} ${mobileActivePanel === 'logs' ? styles.active : ''}`}
                  onClick={() => setMobileActivePanel('logs')}
                >
                  <TermIcon size={16} />
                  <span>Logs</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {layoutMode === 'split' && (
                <PanelGroup orientation="horizontal">
                  <Panel 
                    panelRef={sidebarRef}
                    defaultSize="18%" 
                    minSize="12%" 
                    maxSize="28%" 
                    collapsible={true}
                    collapsedSize={0}
                    onResize={(size) => setSidebarCollapsed(size.asPercentage === 0)}
                  >
                    <Sidebar />
                  </Panel>
                  <PanelResizeHandle className={styles.resizeHandle} />
                  
                  <Panel defaultSize="52%" minSize="30%">
                    <PanelGroup orientation="vertical">
                      <Panel defaultSize="75%" minSize="35%">
                        <div className={styles.centerPanel}>
                          <EditorTabs />
                          <div className={styles.editorWrapper}>
                            {activeFile ? (
                              isBinaryFile(activeFile.name) ? (
                                <AssetPreview file={activeFile} />
                              ) : (
                                <Editor 
                                  path={activeFile.id}
                                  value={activeFile.content} 
                                  onChange={(val) => updateFile(activeFile.id, val || '')} 
                                />
                              )
                            ) : (
                              <div className={styles.emptyEditor}>
                                <p>Select a file from the explorer to start editing.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Panel>
                      
                      <PanelResizeHandle className={styles.resizeHandleRow} />
                      
                      <Panel 
                        panelRef={logsRef}
                        defaultSize="25%" 
                        minSize="10%"
                        collapsible={true}
                        collapsedSize="0%"
                        onResize={(size) => setLogsCollapsed(size.asPercentage === 0)}
                      >
                        <TerminalPanel />
                      </Panel>
                    </PanelGroup>
                  </Panel>
                  
                  <PanelResizeHandle className={styles.resizeHandle} />
                  
                  <Panel defaultSize="30%" minSize="20%">
                    <div className={styles.previewPanel}>
                      <LivePreview ast={ast} error={null} activeFileName={activeFile?.name} />
                    </div>
                  </Panel>
                </PanelGroup>
              )}

              {layoutMode === 'editor' && (
                <div className={styles.editorOnlyContainer}>
                  <div className={styles.centerPanel}>
                    <EditorTabs />
                    <div className={styles.editorWrapper}>
                      {activeFile ? (
                        isBinaryFile(activeFile.name) ? (
                          <AssetPreview file={activeFile} />
                        ) : (
                          <Editor 
                            path={activeFile.id}
                            value={activeFile.content} 
                            onChange={(val) => updateFile(activeFile.id, val || '')} 
                          />
                        )
                      ) : (
                        <div className={styles.emptyEditor}>
                          <p>Select a file from the explorer to start editing.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {layoutMode === 'preview' && (
                <div className={styles.previewOnlyContainer}>
                  <LivePreview ast={ast} error={null} activeFileName={activeFile?.name} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      <CommandPalette 
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onCompile={handleCompilePptx}
        onFormat={handleFormatActive}
      />

      {isLoadingTemplate && (
        <div className={homeStyles.loadingOverlay}>
          <div className={homeStyles.loaderGlowContainer}>
            <div className={homeStyles.loaderGlowRing}></div>
            <Sparkles className={homeStyles.loaderCenterIcon} size={28} />
          </div>
          <div className={homeStyles.loaderHeading}>Assembling Workspace</div>
          <div className={homeStyles.loaderSub}>loading: {loadingTemplateName}</div>
        </div>
      )}

      <HelpDrawer />
      <AboutModal />
      <AuthModal />
      <UploadModal />
      <ProfileDashboard />
    </main>
  );
};

export default function Home() {
  return (
    <ProjectProvider>
      <Workspace />
    </ProjectProvider>
  );
}
