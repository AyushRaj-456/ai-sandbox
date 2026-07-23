import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Link2 } from 'lucide-react';

export default function Navbar({ onOpenConnectModal }) {
  const navTabs = [
    { name: 'HOME', path: '/' },
    { name: 'CONTESTS', path: '/contests' },
    { name: 'TIME ANALYSIS', path: '/time-analysis' },
    { name: 'MISTAKE VAULT', path: '/mistakes' },
    { name: 'MILESTONES', path: '/milestones' },
    { name: 'AI COACH', path: '/ai-coach' },
    { name: 'LEARNING GRAPH', path: '/learning-graph' },
  ];

  return (
    <header style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px 8px 20px', backgroundColor: '#ffffff' }}>
      {/* Top Utility Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '12px', color: '#4a5568' }}>
        <div>
          <span style={{ fontWeight: '500' }}>Kernious — Kernel + Ingenious</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onOpenConnectModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '11px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Sync Handles</span>
          </button>

          <span style={{ color: '#cbd5e1' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
            <span className="user-cyan">_ayush</span>
            <span style={{ fontSize: '11px', color: '#718096', fontWeight: '400' }}>(1542)</span>
          </div>

          <span style={{ color: '#cbd5e1' }}>|</span>

          <a href="#" style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '12px' }}>Logout</a>
        </div>
      </div>

      {/* Codeforces Main Logo Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Codeforces 3 colored bars logo: Yellow, Cyan/Blue, Red */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '36px' }}>
            <span style={{ width: '11px', height: '24px', backgroundColor: '#eab308', borderRadius: '2px' }}></span>
            <span style={{ width: '11px', height: '36px', backgroundColor: '#0284c7', borderRadius: '2px' }}></span>
            <span style={{ width: '11px', height: '20px', backgroundColor: '#ef4444', borderRadius: '2px' }}></span>
          </div>

          <div style={{ lineHeight: '1.1' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '26px', fontWeight: '900', color: '#111827', letterSpacing: '-0.5px', fontFamily: 'Arial, sans-serif' }}>
                CODEFORCES
              </span>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#7e22ce', letterSpacing: '0.5px' }}>
                KERNIOUS — KERNEL + INGENIOUS
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '3px 0 0 0', fontWeight: '500' }}>
              Sponsored by TON & AI Mentorship Engine
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search problem..."
            style={{
              width: '180px',
              padding: '5px 28px 5px 10px',
              border: '1px solid #b9b9b9',
              borderRadius: '4px',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          <Search style={{ width: '14px', height: '14px', color: '#6b7280', position: 'absolute', right: '8px', top: '8px' }} />
        </div>
      </div>

      {/* Codeforces Rounded Main Navigation Box */}
      <div style={{
        border: '1px solid #b9b9b9',
        borderRadius: '8px',
        padding: '4px 16px',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto'
      }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '13px', fontWeight: '700', fontFamily: '"Arial Narrow", Arial, sans-serif' }}>
          {navTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                isActive ? 'cf-nav-link-active' : 'cf-nav-link'
              }
              style={({ isActive }) => ({
                display: 'inline-block',
                padding: '8px 4px',
                color: isActive ? '#0000ee' : '#222222',
                borderBottom: isActive ? '3px solid #0000ee' : '3px solid transparent',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                letterSpacing: '0.5px'
              })}
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Codeforces Sub-Navigation Bar (Main, Problems, Submit, Status...) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', paddingLeft: '4px', fontSize: '11px', fontWeight: '700' }}>
        <span style={{ padding: '3px 10px', borderRadius: '4px', backgroundColor: '#94a3b8', color: '#ffffff' }}>
          MAIN
        </span>
        <a href="#" style={{ color: '#222222', textDecoration: 'none' }}>ACMSGURU</a>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span style={{ padding: '3px 10px', borderRadius: '4px', backgroundColor: '#cbd5e1', color: '#1e293b' }}>
          PROBLEMS
        </span>
        <a href="#" style={{ color: '#222222', textDecoration: 'none' }}>SUBMIT</a>
        <a href="#" style={{ color: '#222222', textDecoration: 'none' }}>STATUS</a>
        <a href="#" style={{ color: '#222222', textDecoration: 'none' }}>STANDINGS</a>
        <a href="#" style={{ color: '#222222', textDecoration: 'none' }}>CUSTOM TEST</a>
      </div>
    </header>
  );
}
