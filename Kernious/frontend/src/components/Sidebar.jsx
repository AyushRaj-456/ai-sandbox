import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const topRatedUsers = [
    { rank: 1, handle: 'jiangly', rating: 3812, color: 'user-red' },
    { rank: 2, handle: 'VivaciousAubergine', rating: 3647, color: 'user-red' },
    { rank: 3, handle: 'maroonrk', rating: 3536, color: 'user-red' },
    { rank: 4, handle: 'tourist', rating: 3530, color: 'user-red' },
    { rank: 5, handle: 'strapple', rating: 3515, color: 'user-red' },
  ];

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-5">
      {/* Box 1: Pay Attention / AI Coach Alert */}
      <div className="cf-box">
        <div className="cf-box-header">
          <span>→ Pay attention</span>
        </div>
        <div className="cf-box-content space-y-2 text-xs leading-relaxed">
          <p className="font-bold text-gray-800">Before Next Contest</p>
          <p className="text-blue-700 font-bold cursor-pointer hover:underline text-sm">
            Codeforces Round 1111 (Div. 2)
          </p>
          <p className="text-xs text-gray-600 font-mono">10:17:52</p>
          <a href="#" className="text-blue-700 text-xs underline font-bold block pt-1">
            Register now »
          </a>
        </div>
      </div>

      {/* Box 2: Codeforces User Profile Box */}
      <div className="cf-box">
        <div className="cf-box-header">
          <span>→ ._ayush</span>
        </div>
        <div className="cf-box-content space-y-3.5 text-xs">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 leading-relaxed">
              <p className="text-gray-800 font-bold">
                Rating: <span className="user-cyan">1542</span>
              </p>
              <p className="text-gray-700">Rank: <span className="user-cyan">Specialist</span></p>
              <p className="text-gray-700">Contribution: <span className="text-green-700 font-bold">0</span></p>
              <p className="text-gray-700">Streak: <span className="font-bold text-orange-600">14 Days</span></p>
            </div>
            <div className="w-20 h-20 rounded bg-gradient-to-br from-cyan-600 to-blue-800 text-white flex items-center justify-center font-bold text-2xl border border-gray-400 shadow-xs">
              AY
            </div>
          </div>

          <hr className="border-gray-200" />

          <ul className="space-y-2 text-blue-700 text-xs font-semibold">
            <li><NavLink to="/" className="hover:underline">• Unified Dashboard</NavLink></li>
            <li><NavLink to="/contests" className="hover:underline">• Contest History & Submissions</NavLink></li>
            <li><NavLink to="/mistakes" className="hover:underline">• Personal Mistake Database</NavLink></li>
            <li><NavLink to="/time-analysis" className="hover:underline">• Time Analysis & Solve Diagnostics</NavLink></li>
            <li><NavLink to="/weak-topics" className="hover:underline">• Weak Topics Matrix</NavLink></li>
            <li><NavLink to="/ai-coach" className="hover:underline">• AI Coach Chat</NavLink></li>
          </ul>
        </div>
      </div>

      {/* Box 3: Synced Handles */}
      <div className="cf-box">
        <div className="cf-box-header">
          <span>→ Synced Platforms</span>
        </div>
        <div className="cf-box-content space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-700">Codeforces:</span>
            <span className="user-cyan">tourist_fan</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-700">LeetCode:</span>
            <span className="user-orange">alex_codes</span>
          </div>
        </div>
      </div>

      {/* Box 4: Codeforces Global Top Rated */}
      <div className="cf-box">
        <div className="cf-box-header">
          <span>→ Top rated</span>
        </div>
        <div className="p-0">
          <table className="cf-table text-xs">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>User</th>
                <th className="text-right">Rating</th>
              </tr>
            </thead>
            <tbody>
              {topRatedUsers.map((u) => (
                <tr key={u.rank}>
                  <td className="text-gray-500 font-mono">{u.rank}</td>
                  <td>
                    <span className={u.color}>{u.handle}</span>
                  </td>
                  <td className="text-right font-mono font-bold text-gray-700">{u.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </aside>
  );
}
