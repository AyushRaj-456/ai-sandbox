import React, { useState } from 'react';
import { api } from '../services/api';
import { User, Lock, Mail, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide email and password.');
      return;
    }

    if (activeTab === 'register' && !name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (activeTab === 'register') {
        res = await api.register(name, email, password);
      } else {
        res = await api.loginAuth(email, password);
      }

      if (res.token) {
        localStorage.setItem('kernious_token', res.token);
        localStorage.setItem('kernious_user', JSON.stringify(res));
        if (onAuthSuccess) {
          onAuthSuccess(res);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #b9b9b9',
          borderRadius: '4px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div style={{ backgroundColor: '#3b5998', color: '#ffffff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '700' }}>
            → Kernious — Kernel + Ingenious
          </span>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e1e1e1', backgroundColor: '#f8f9fa' }}>
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid #3b5998' : 'none',
              backgroundColor: activeTab === 'login' ? '#ffffff' : 'transparent',
              color: activeTab === 'login' ? '#3b5998' : '#666666',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '12px',
              fontWeight: '700',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid #3b5998' : 'none',
              backgroundColor: activeTab === 'register' ? '#ffffff' : 'transparent',
              color: activeTab === 'register' ? '#3b5998' : '#666666',
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', fontSize: '12px' }}>
          {error && (
            <div style={{ padding: '8px 12px', marginBottom: '14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '3px', color: '#991b1b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'register' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: '700', color: '#444444', marginBottom: '4px' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '10px', top: '9px', width: '14px', height: '14px', color: '#888888' }} />
                <input
                  type="text"
                  placeholder="e.g. Ayush Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px 6px 30px', border: '1px solid #b9b9b9', borderRadius: '2px', outline: 'none' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontWeight: '700', color: '#444444', marginBottom: '4px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '10px', top: '9px', width: '14px', height: '14px', color: '#888888' }} />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '6px 8px 6px 30px', border: '1px solid #b9b9b9', borderRadius: '2px', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: '700', color: '#444444', marginBottom: '4px' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock style={{ position: 'absolute', left: '10px', top: '9px', width: '14px', height: '14px', color: '#888888' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '6px 8px 6px 30px', border: '1px solid #b9b9b9', borderRadius: '2px', outline: 'none' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#3b5998',
              color: '#ffffff',
              border: 'none',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Authenticating...' : activeTab === 'register' ? 'Create My Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
