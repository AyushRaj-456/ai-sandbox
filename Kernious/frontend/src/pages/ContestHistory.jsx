import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRatingInfo } from '../utils/theme';
import { api } from '../services/api';
import PlatformSelector from '../components/PlatformSelector';

export default function ContestHistory({ refreshKey }) {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [contestDetailsMap, setContestDetailsMap] = useState({});
  const [platform, setPlatform] = useState('all');
  const [statuses, setStatuses] = useState({
    codeforces: "not_connected",
    leetcode: "not_connected"
  });

  useEffect(() => {
    loadStatuses();
    loadContests();
  }, [refreshKey, platform]);

  const loadStatuses = async () => {
    try {
      const data = await api.getPlatformStatus();
      if (data) {
        setStatuses(data);
      }
    } catch (err) {
      console.error("Failed to load platform statuses:", err);
    }
  };

  const loadContests = async () => {
    setLoading(true);
    try {
      const data = await api.getContests(platform);
      setContests(data || []);
      if (data && data.length > 0) {
        toggleRowExpansion(data[0].id);
      } else {
        setExpandedRow(null);
      }
    } catch (err) {
      console.error("Failed to load contests:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = async (contestId) => {
    if (expandedRow === contestId) {
      setExpandedRow(null);
      return;
    }

    setExpandedRow(contestId);
    if (!contestDetailsMap[contestId]) {
      try {
        const detail = await api.getContestDetail(contestId);
        setContestDetailsMap((prev) => ({ ...prev, [contestId]: detail }));
      } catch (err) {
        console.error(`Failed to load details for contest ${contestId}:`, err);
      }
    }
  };

  const isPlatformConnected = platform === 'all' || statuses[platform] === 'synced';

  return (
    <div className="space-y-4">
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span>→ Contests History & Detailed Performance Breakdown</span>
            <PlatformSelector selectedPlatform={platform} onChange={setPlatform} />
          </div>
          <span className="text-xs font-normal text-gray-600 font-mono">
            {isPlatformConnected ? `${contests.length} ${contests.length === 1 ? 'Contest' : 'Contests'} Logged` : ''}
          </span>
        </div>
        <div className="p-0 overflow-x-auto">
          {!isPlatformConnected ? (
            <div className="p-6 text-center text-xs text-gray-500 font-mono">
              Not Connected — sync this platform to see data
            </div>
          ) : loading ? (
            <div className="p-4 text-center text-xs text-gray-500">Loading contest history...</div>
          ) : contests.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">
              No contests synced yet. Click "Connect Platform" in the top bar to sync your handles!
            </div>
          ) : (
            <table className="cf-dense-table">
              <thead>
                <tr>
                  <th>Contest Name</th>
                  <th>Platform</th>
                  <th>Date</th>
                  <th>Rank</th>
                  <th>Solved</th>
                  <th>Rating Change</th>
                  <th>New Rating</th>
                  <th className="text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contests.map((c) => {
                  const ratingInfo = getRatingInfo(c.ratingAfter);
                  const detail = contestDetailsMap[c.id];
                  const isExpanded = expandedRow === c.id;

                  return (
                    <React.Fragment key={c.id}>
                      <tr className="hover:bg-blue-50/30 transition-colors">
                        <td
                          className="font-bold text-blue-700 hover:underline cursor-pointer"
                          onClick={() => toggleRowExpansion(c.id)}
                        >
                          {c.name}
                        </td>
                        <td className="font-mono text-xs text-gray-600">{c.platform}</td>
                        <td className="font-mono text-xs text-gray-600">{c.date}</td>
                        <td className="font-mono font-bold text-gray-700">#{c.rank}</td>
                        <td className="font-mono text-gray-700">{c.solved}</td>
                        <td className="font-mono font-bold">
                          <span className={c.ratingDelta >= 0 ? 'text-green-700' : 'text-red-600'}>
                            {c.ratingDelta >= 0 ? `+${c.ratingDelta}` : c.ratingDelta}
                          </span>
                        </td>
                        <td className={`font-mono font-bold ${ratingInfo.className}`}>
                          {c.ratingAfter}
                        </td>
                        <td className="text-right text-xs">
                          <button
                            onClick={() => toggleRowExpansion(c.id)}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs transition cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Details ▲' : 'View Details & AI Summary ▼'}</span>
                          </button>
                        </td>
                      </tr>

                      {/* Inline Expanded Contest Detail Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-[#f8f9fa] p-4 border-t border-b border-[#e1e1e1]">
                            <div className="space-y-4">
                              {/* 1. AI Summary Header */}
                              <div className="p-3.5 bg-white border border-[#e1e1e1] rounded text-xs space-y-2">
                                <span className={`font-bold text-sm block border-b border-gray-100 pb-1.5 ${c.isClean ? 'text-emerald-800' : 'text-blue-800'}`}>
                                  {c.isClean ? 'AI Performance Summary' : 'AI Root-Cause Summary'}
                                </span>
                                <div className="text-gray-800 whitespace-pre-line font-sans leading-relaxed text-xs">
                                  {c.summary}
                                </div>
                              </div>

                              {/* 2. Problem Breakdown Table */}
                              {detail && detail.problems && detail.problems.length > 0 && (
                                <div className="p-3.5 bg-white border border-[#e1e1e1] rounded text-xs space-y-2">
                                  <span className="font-bold text-gray-800 text-xs block border-b border-gray-100 pb-1">
                                    Contest Problem Breakdown
                                  </span>
                                  <table className="cf-dense-table w-full text-xs">
                                    <thead>
                                      <tr>
                                        <th>Problem</th>
                                        <th>Difficulty</th>
                                        <th>Status</th>
                                        <th>Verdict</th>
                                        <th>Attempts</th>
                                        <th>Tags</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {detail.problems.map((p, pIdx) => (
                                        <tr key={pIdx}>
                                          <td className="font-bold text-slate-800">{p.problem}</td>
                                          <td className="font-mono text-slate-600">{p.difficulty ? `${p.difficulty}★` : '—'}</td>
                                          <td>
                                            <span className={p.status === 'Accepted' ? 'text-green-700 font-bold' : 'text-red-600 font-semibold'}>
                                              {p.status}
                                            </span>
                                          </td>
                                          <td className="font-mono text-slate-700">{p.verdict}</td>
                                          <td className="font-mono text-slate-700">{p.attempts}</td>
                                          <td className="font-mono text-xs text-gray-500">
                                            {p.tags && p.tags.length > 0 ? p.tags.join(', ') : 'None'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

