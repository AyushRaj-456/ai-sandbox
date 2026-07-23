import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Link2, LogOut, Users } from 'lucide-react';
import { getRatingInfo } from '../utils/theme';
import { api } from '../services/api';

export default function Header({ userProfile, onOpenConnectModal, onLogout }) {
  const [totalUsers, setTotalUsers] = useState(null);

  useEffect(() => {
    loadTotalUsers();
  }, []);

  const loadTotalUsers = async () => {
    try {
      const res = await api.getTotalUsers();
      if (res && typeof res.total_users === 'number') {
        setTotalUsers(res.total_users);
      }
    } catch (err) {
      console.error("Failed to load total users stat:", err);
    }
  };

  const cfRating = userProfile?.current_ratings?.codeforces || 0;
  const cfHandle = userProfile?.handles?.codeforces || '';
  const userName = userProfile?.name || 'Competitor';
  const ratingInfo = getRatingInfo(cfRating);

  const navTabs = [
    { name: 'Dashboard', path: '/' },
    { name: 'Contests', path: '/contests' },
    { name: 'Time Analysis', path: '/time-analysis' },
    { name: 'Mistake Vault', path: '/mistakes' },
    { name: 'Weak Topics', path: '/weak-topics' },
    { name: 'AI Coach', path: '/ai-coach' },
  ];

  return (
    <header className="bg-white border-b border-[#e1e1e1] max-w-[1180px] mx-auto w-full px-4 pt-2 pb-0">
      {/* Top Utility Header Row — Clean Horizontal Flex Row */}
      <div className="flex items-center justify-between min-h-[75px] py-2 border-b border-[#e5e7eb] px-1">
        {/* Left Zone: Kernious Wordmark (63px, cornflowerblue, bold) */}
        <div className="flex items-center">
          <span style={{ fontSize: '63px', fontWeight: 'bold', color: 'cornflowerblue', leading: '1' }}>
            Kernious
          </span>
        </div>

        {/* Center Zone: Total Users Counter (22px, blue, bold) */}
        <div className="flex items-center justify-center">
          {totalUsers !== null && (
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'blue' }}>
              Total Users: {totalUsers.toLocaleString()}
            </span>
          )}
        </div>

        {/* Right Zone: Sync / Profile / Logout Cluster */}
        <div className="flex items-center gap-5 text-xs">
          <button
            onClick={onOpenConnectModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-md shadow-2xs transition cursor-pointer shrink-0"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Sync Platforms</span>
          </button>

          <div className="flex items-center gap-1 text-xs shrink-0">
            <span className="font-bold text-slate-800">{userName}</span>
            {cfHandle ? (
              <span className={`font-mono font-bold ${ratingInfo.className}`}>
                ({cfHandle} • {cfRating})
              </span>
            ) : (
              <span className="text-gray-400 font-mono">(Unlinked)</span>
            )}
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs rounded transition cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pt-1">
        <nav className="flex space-x-1 text-xs font-bold">
          {navTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                isActive ? 'cf-tab-item-active' : 'cf-tab-item'
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
