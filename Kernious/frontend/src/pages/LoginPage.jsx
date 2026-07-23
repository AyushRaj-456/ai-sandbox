import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { User, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user is already authenticated, redirect straight to dashboard
  useEffect(() => {
    const token = localStorage.getItem('kernious_token');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

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

      if (res && res.token) {
        localStorage.setItem('kernious_token', res.token);
        localStorage.setItem('kernious_user', JSON.stringify(res));
        if (onAuthSuccess) {
          onAuthSuccess(res);
        }
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f6f9',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {/* Container Box */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: '#ffffff',
        border: '1px solid #b9b9b9',
        borderRadius: '3px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* Codeforces Aesthetic Top Header Bar */}
        <div style={{
          backgroundColor: '#e1e1e1',
          borderBottom: '1px solid #b9b9b9',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'end', gap: '3px', height: '16px' }}>
              <span style={{ width: '5px', height: '11px', backgroundColor: '#eab308', borderRadius: '1px' }}></span>
              <span style={{ width: '5px', height: '16px', backgroundColor: '#0284c7', borderRadius: '1px' }}></span>
              <span style={{ width: '5px', height: '9px', backgroundColor: '#ef4444', borderRadius: '1px' }}></span>
            </div>
            <span style={{ fontWeight: '700', color: '#111827', fontSize: '13px', tracking: '-0.025em' }}>
              Kernious — Kernel + Ingenious
            </span>
          </div>
        </div>

        {/* Tab Switcher Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e1e1e1', backgroundColor: '#f8f9fa' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: activeTab === 'login' ? '#ffffff' : '#f8f9fa',
              color: activeTab === 'login' ? '#3b5998' : '#555555',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid #3b5998' : '1px solid #e1e1e1',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: activeTab === 'register' ? '#ffffff' : '#f8f9fa',
              color: activeTab === 'register' ? '#3b5998' : '#555555',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid #3b5998' : '1px solid #e1e1e1',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
          {error && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '3px',
              color: '#991b1b',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px'
            }}>
              <AlertCircle style={{ width: '14px', height: '14px', color: '#dc2626', flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontWeight: '700', color: '#444444', fontSize: '11px' }}>Full Name</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User style={{ position: 'absolute', left: '10px', width: '15px', height: '15px', color: '#888888', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="e.g. Ayush Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px 7px 32px',
                    border: '1px solid #b9b9b9',
                    borderRadius: '2px',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontWeight: '700', color: '#444444', fontSize: '11px' }}>Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail style={{ position: 'absolute', left: '10px', width: '15px', height: '15px', color: '#888888', pointerEvents: 'none' }} />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  border: '1px solid #b9b9b9',
                  borderRadius: '2px',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontWeight: '700', color: '#444444', fontSize: '11px' }}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock style={{ position: 'absolute', left: '10px', width: '15px', height: '15px', color: '#888888', pointerEvents: 'none' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  border: '1px solid #b9b9b9',
                  borderRadius: '2px',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '9px',
              backgroundColor: '#3b5998',
              color: '#ffffff',
              border: 'none',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxSizing: 'border-box',
              marginTop: '6px'
            }}
          >
            <span>{loading ? 'Authenticating...' : activeTab === 'register' ? 'Create Account' : 'Sign In'}</span>
            {!loading && <ArrowRight style={{ width: '14px', height: '14px' }} />}
          </button>

          <p style={{
            fontSize: '10px',
            color: '#777777',
            textAlign: 'center',
            paddingTop: '10px',
            borderTop: '1px solid #ededed',
            marginTop: '6px',
            marginBottom: 0
          }}>
            AI-Powered Competitive Programming Coach & Multi-Platform Analytics
          </p>
        </form>
      </div>
    </div>
  );
}
