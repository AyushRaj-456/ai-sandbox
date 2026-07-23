import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ContestDetail({ contestId }) {
  const [searchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [contestData, setContestData] = useState(null);
  const [loading, setLoading] = useState(true);

  const queryContestId = searchParams.get('id');
  const effectiveId = contestId || queryContestId;

  useEffect(() => {
    loadContestDetail();
  }, [effectiveId]);

  const loadContestDetail = async () => {
    setLoading(true);
    try {
      let targetId = effectiveId;
      if (!targetId) {
        const list = await api.getContests();
        if (list && list.length > 0) {
          targetId = list[0].id;
        }
      }

      if (targetId) {
        const detail = await api.getContestDetail(targetId);
        setContestData(detail);
      }
    } catch (err) {
      console.error("Failed to load contest detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const name = contestData?.name || "Codeforces Contest";
  const rank = contestData?.rank || 0;
  const ratingDelta = contestData?.rating_change || 0;
  const attempted = contestData?.problems_attempted || 0;
  const solved = contestData?.problems_solved || 0;
  const penalties = contestData?.wrong_submissions || 0;

  const problemSubmissions = contestData?.problems || [];

  return (
    <div className="space-y-4">
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <span>→ Contest Detail: {name}</span>
          <span className="user-cyan font-bold">
            Rank #{rank} ({ratingDelta >= 0 ? `+${ratingDelta}` : ratingDelta} pts)
          </span>
        </div>
        <div className="cf-panel-body space-y-4 text-xs">
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-500">Loading contest details...</div>
          ) : (
            <>
              {/* Attempted vs Solved Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 bg-gray-50 border border-[#e1e1e1] rounded text-center">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Attempted</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{attempted} Problems</p>
                </div>
                <div className="p-2.5 bg-gray-50 border border-[#e1e1e1] rounded text-center">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Solved</p>
                  <p className="text-base font-bold text-green-700 mt-0.5">{solved} Problems</p>
                </div>
                <div className="p-2.5 bg-gray-50 border border-[#e1e1e1] rounded text-center">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Wrong Submissions</p>
                  <p className="text-base font-bold text-red-600 mt-0.5">{penalties} Penalties</p>
                </div>
                <div className="p-2.5 bg-gray-50 border border-[#e1e1e1] rounded text-center">
                  <p className="text-[11px] text-gray-500 font-bold uppercase">Total Time Spent</p>
                  <p className="text-base font-bold text-purple-700 mt-0.5">2h 00m</p>
                </div>
              </div>

              {/* Sub-tab Switcher */}
              <div className="flex space-x-1 border-b border-[#e1e1e1] pb-2 font-bold">
                <button
                  onClick={() => setActiveSubTab('overview')}
                  className={`px-3 py-1 rounded ${activeSubTab === 'overview' ? 'bg-[#3b5998] text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Problem Submissions Breakdown
                </button>
                <button
                  onClick={() => setActiveSubTab('comparison')}
                  className={`px-3 py-1 rounded ${activeSubTab === 'comparison' ? 'bg-[#3b5998] text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  AI Code Comparison
                </button>
              </div>

              {activeSubTab === 'overview' && (
                <div>
                  {problemSubmissions.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No problem submission breakdown logged for this contest yet.
                    </div>
                  ) : (
                    <table className="cf-dense-table">
                      <thead>
                        <tr>
                          <th>Problem</th>
                          <th>Status</th>
                          <th>Solve Time</th>
                          <th>Attempts</th>
                          <th>Verdict Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {problemSubmissions.map((p, idx) => (
                          <tr key={idx}>
                            <td className="font-bold text-blue-700">{p.problem || `Problem ${p.index} - ${p.name}`}</td>
                            <td>
                              <span className={p.status === 'Accepted' ? 'verdict-accepted' : 'text-gray-500 font-bold'}>
                                {p.status}
                              </span>
                            </td>
                            <td className="font-mono">{p.time || '00:45'}</td>
                            <td className="font-mono">{p.attempts || 1}</td>
                            <td className="font-mono text-xs">{p.verdict || 'OK'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeSubTab === 'comparison' && (
                <div className="p-6 bg-gray-50 border border-[#e1e1e1] rounded text-center space-y-2">
                  <p className="font-bold text-sm text-gray-700">Not enough data for code comparison</p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Codeforces public API does not expose submission source code without explicit OAuth account permissions. Save a problem note or solution snippet in the Mistake Vault to generate AI code reviews.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

