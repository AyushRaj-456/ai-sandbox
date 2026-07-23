"use client";

import React, { useEffect, useState } from 'react';
import { Upload, Sparkles, FolderPlus, Tag, Image as ImageIcon } from 'lucide-react';
import { uploadTemplateDeck, getStoredAuth } from '../utils/firebase';
import styles from './AboutModal.module.css'; // Shared premium overlay layout styles

export const UploadModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('AI Startup');
  const [tagsInput, setTagsInput] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const handleOpen = () => {
      setTitle('');
      setDescription('');
      setCategory('AI Startup');
      setTagsInput('');
      setCoverUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800');
      setError('');
      setSuccess('');
      setIsOpen(true);
    };

    window.addEventListener('open-upload-modal', handleOpen);
    return () => {
      window.removeEventListener('open-upload-modal', handleOpen);
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const profile = getStoredAuth();
    if (!profile) {
      setError("You must be signed in to upload templates.");
      setLoading(false);
      return;
    }

    try {
      // Fetch current workspace files from localStorage to serialize
      const storedWorkspace = localStorage.getItem("dextranic_workspace_files");
      let activeFiles: { name: string; content: string }[] = [];
      
      if (storedWorkspace) {
        try {
          const parsed = JSON.parse(storedWorkspace);
          activeFiles = parsed.map((f: any) => ({
            name: f.name || "main.dex",
            content: f.content || ""
          }));
        } catch (err) {
          console.warn("Failed to parse local storage workspace, using default seed file.");
        }
      }

      if (activeFiles.length === 0) {
        activeFiles = [
          {
            name: "main.dex",
            content: `theme {
  primary: "#0f172a"
  secondary: "#38bdf8"
  font: "Outfit"
}

slide {
  title: "New Presentation"
  bullets {
    "Write slide lines programmatically"
  }
}`
          }
        ];
      }

      const tags = tagsInput.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

      await uploadTemplateDeck({
        title: title.trim(),
        description: description.trim(),
        category,
        creatorId: profile.uid,
        creatorName: profile.username,
        creatorAvatar: profile.avatarUrl,
        tags,
        thumbnailUrl: coverUrl.trim() || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
        zipUrl: "", // Cloud Storage URL can be injected here
        files: activeFiles
      });

      setSuccess("Template uploaded successfully to Community Hub!");
      window.dispatchEvent(new CustomEvent('community-templates-updated'));

      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to publish template.");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Startup Pitch", "Technical Deck", "Academic", "Product Launch",
    "AI Startup", "Minimal Keynote", "Futuristic Tech", "Business Proposal"
  ];

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div 
        className={styles.modal} 
        style={{ maxWidth: '520px', height: 'auto', minHeight: '450px' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoTitle}>
            <FolderPlus size={18} className={styles.logoIcon} style={{ color: '#ec4899' }} />
            <h3>PUBLISH WORKSPACE TEMPLATE</h3>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Info Box */}
        <div style={{
          margin: '0 24px 16px',
          padding: '10px 14px',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: '#e0f2fe',
          lineHeight: '1.4'
        }}>
          💡 <strong>Workspace Publisher:</strong> This form will package and serialize all active <code>.dex</code> files in your editor tab workspace into a public presentation template.
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>
              {success}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>TEMPLATE TITLE</label>
            <input 
              type="text"
              required
              placeholder="e.g. Chrome Venture Deck"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: '#ffffff',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>DESCRIPTION</label>
            <textarea 
              required
              placeholder="Describe the aesthetic and core slide features of this template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: '#ffffff',
                outline: 'none',
                fontSize: '0.85rem',
                resize: 'none',
                lineHeight: '1.4'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>CATEGORY</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat} style={{ backgroundColor: '#0f172a' }}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>TAGS (COMMA SEPARATED)</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Tag size={14} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                <input 
                  type="text"
                  placeholder="cyber, gold, startup"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 34px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>COVER BANNER IMAGE URL</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ImageIcon size={14} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
              <input 
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#ec4899',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease',
              boxShadow: '0 4px 14px rgba(236, 72, 153, 0.3)'
            }}
          >
            {loading ? (
              <span>Publishing...</span>
            ) : (
              <>
                <Upload size={16} />
                <span>Publish to Dextranic Hub</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
