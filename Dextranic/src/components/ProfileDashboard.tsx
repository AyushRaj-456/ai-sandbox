"use client";

import React, { useEffect, useState } from 'react';
import { User, LogOut, FileText, Heart, Shield } from 'lucide-react';
import { getStoredAuth, signOutUser, UserProfile, fetchCommunityTemplates, TemplateDeck } from '../utils/firebase';
import styles from './AboutModal.module.css'; // Leverage standard glass overlays

export const ProfileDashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userTemplates, setUserTemplates] = useState<TemplateDeck[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProfileData = async () => {
    const authUser = getStoredAuth();
    setProfile(authUser);
    
    if (authUser) {
      setLoading(true);
      try {
        const community = await fetchCommunityTemplates();
        const personal = community.filter(t => t.creatorId === authUser.uid);
        setUserTemplates(personal);
      } catch (err) {
        console.error("Failed to load user templates:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleOpen = () => {
      loadProfileData();
      setIsOpen(true);
    };

    window.addEventListener('open-profile-dashboard', handleOpen);
    return () => {
      window.removeEventListener('open-profile-dashboard', handleOpen);
    };
  }, []);

  if (!isOpen || !profile) return null;

  const handleLogout = async () => {
    await signOutUser();
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
    setIsOpen(false);
  };

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div 
        className={styles.modal} 
        style={{ maxWidth: '480px', height: 'auto', minHeight: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoTitle}>
            <Shield size={18} className={styles.logoIcon} style={{ color: '#10b981' }} />
            <h3>CREATOR PROFILE</h3>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>

        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(255, 255, 255, 0.01)'
        }}>
          <img 
            src={profile.avatarUrl} 
            alt="User avatar" 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid #38bdf8',
              padding: '2px',
              backgroundColor: '#0f172a'
            }}
          />
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>@{profile.username}</h4>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>{profile.email}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase'
              }}>
                Verified Creator
              </span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          padding: '24px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FileText size={20} style={{ color: '#38bdf8' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{userTemplates.length}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Decks Published</div>
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Heart size={20} style={{ color: '#ec4899' }} />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                {userTemplates.reduce((acc, t) => acc + t.likes, 0)}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Stars</div>
            </div>
          </div>
        </div>

        {/* Templates list */}
        <div style={{ padding: '0 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', margin: '0 0 4px', textTransform: 'uppercase' }}>Your Community Contributions</h4>
          
          {loading ? (
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : userTemplates.length === 0 ? (
            <div style={{
              fontSize: '0.8rem',
              color: '#64748b',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '24px',
              border: '1px dashed rgba(255, 255, 255, 0.05)',
              borderRadius: '6px'
            }}>
              You haven't uploaded any presentations yet! Publish one from your active editor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }} className="premium-scroll">
              {userTemplates.map((deck) => (
                <div key={deck.templateId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '6px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{deck.title}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{deck.category} • {deck.likes} stars</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Clone into workspace
                      localStorage.setItem("dextranic_workspace_files", JSON.stringify(deck.files));
                      window.dispatchEvent(new CustomEvent('workspace-loaded'));
                      setIsOpen(false);
                      alert(`Cloned "${deck.title}" successfully into your active editor!`);
                    }}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with logout */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.005)'
        }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            style={{
              padding: '6px 14px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};
