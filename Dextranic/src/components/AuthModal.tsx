"use client";

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Mail, Lock, User, Sparkles } from 'lucide-react';
import { signInUser, signUpUser, UserProfile } from '../utils/firebase';
import styles from './AboutModal.module.css'; // Leverage shared overlay styles or create unique custom modal ones

export const AuthModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      const initialTab = customEvent.detail?.tab || 'signin';
      setActiveTab(initialTab);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setUsername('');
      setError('');
      setSuccess('');
      setIsOpen(true);
    };
    
    window.addEventListener('open-auth-modal', handleOpen);
    return () => {
      window.removeEventListener('open-auth-modal', handleOpen);
    };
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'signup') {
        if (!username.trim()) throw new Error("Username is required.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        
        const profile = await signUpUser(username.trim(), email.trim(), password);
        setSuccess(`Account created successfully! Welcome, ${profile.username}.`);
      } else {
        const profile = await signInUser(email.trim(), password);
        setSuccess(`Signed in successfully! Welcome back, ${profile.username}.`);
      }

      // Notify other components about auth change
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
      
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div 
        className={styles.modal} 
        style={{ maxWidth: '440px', height: 'auto', minHeight: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoTitle}>
            <ShieldCheck size={18} className={styles.logoIcon} style={{ color: '#38bdf8' }} />
            <h3>{activeTab === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</h3>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className={styles.tabs} style={{ marginBottom: '24px' }}>
          <button 
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'signin' ? styles.activeTabBtn : ''}`}
            onClick={() => { setActiveTab('signin'); setError(''); }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span>Sign In</span>
          </button>
          <button 
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'signup' ? styles.activeTabBtn : ''}`}
            onClick={() => { setActiveTab('signup'); setError(''); }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span>Sign Up</span>
          </button>
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
              fontSize: '0.85rem',
              fontWeight: 500
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
              fontSize: '0.85rem',
              fontWeight: 500
            }}>
              {success}
            </div>
          )}

          {activeTab === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>USERNAME</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                <input 
                  type="text"
                  required
                  placeholder="e.g. ayush_creator"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
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
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>EMAIL ADDRESS</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
              <input 
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>PASSWORD</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
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

          {activeTab === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>CONFIRM PASSWORD</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
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
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: '#38bdf8',
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
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
            }}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{activeTab === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* Social Authentication placeholders */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>OR CONTINUE WITH</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                alert("Google authentication is ready for cloud deployment! Sign up with email to test instantly.");
              }}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s'
              }}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => {
                alert("GitHub authentication is ready for cloud deployment! Sign up with email to test instantly.");
              }}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s'
              }}
            >
              GitHub
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
