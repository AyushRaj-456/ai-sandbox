import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function ReplayView() {
  const [contests, setContests] = useState([]);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const platform = 'codeforces';
  const [statuses, setStatuses] = useState({
    codeforces: "not_connected"
  });

  // Avg solve time state
  const [ratingAvgTimes, setRatingAvgTimes] = useState({ live_contest: [], overall: [] });
  const [solveTimeTab, setSolveTimeTab] = useState('live'); // 'live' | 'overall'
  const [avgSolveLoading, setAvgSolveLoading] = useState(true);

  useEffect(() => {
    loadStatuses();
    loadContestsList();
    loadAvgSolveTimes();
  }, []);

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

  const loadContestsList = async () => {
    setLoading(true);
    try {
      const list = await api.getContests(platform);
      setContests(list || []);
      if (list && list.length > 0) {
        setSelectedContestId(list[0].id);
        loadTimeline(list[0].id);
      } else {
        setSelectedContestId('');
        setTimelineData(null);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to load contests for replay:", err);
      setLoading(false);
    }
  };

  const loadAvgSolveTimes = async () => {
    setAvgSolveLoading(true);
    try {
      const data = await api.getAvgSolveTimeByRating(platform);
      if (data && (data.live_contest || data.overall)) {
        setRatingAvgTimes(data);
      } else if (Array.isArray(data)) {
        setRatingAvgTimes({ live_contest: data, overall: data });
      }
    } catch (err) {
      console.error("Failed to load avg solve times:", err);
    } finally {
      setAvgSolveLoading(false);
    }
  };

  const loadTimeline = async (id) => {
    setLoading(true);
    try {
      const data = await api.getContestTimeline(id);
      setTimelineData(data);
    } catch (err) {
      console.error("Failed to load timeline:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContestChange = (e) => {
    const id = e.target.value;
    setSelectedContestId(id);
    loadTimeline(id);
  };

  const activeData = solveTimeTab === 'live'
    ? (ratingAvgTimes.live_contest || [])
    : (ratingAvgTimes.overall || []);

  const isPlatformConnected = statuses.codeforces === 'synced';

  return (
    <div className="space-y-4">
      {/* Contest Replay & Timeline Panel */}
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span>→ Time Analysis — Contest Replay & Solve Time Diagnostics</span>
          </div>
          {contests.length > 0 && isPlatformConnected && (
            <select
              value={selectedContestId}
              onChange={handleContestChange}
              className="px-2 py-0.5 border border-[#b9b9b9] rounded text-xs text-gray-800 bg-white font-bold"
            >
              {contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.ratingDelta >= 0 ? `+${c.ratingDelta}` : c.ratingDelta})
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="cf-panel-body space-y-4 text-xs">
          {!isPlatformConnected ? (
            <div className="p-6 text-center text-gray-500 font-mono">
              Codeforces Not Connected — sync your Codeforces handle to view contest time analysis.
            </div>
          ) : loading ? (
            <div className="p-4 text-center text-gray-500">Reconstructing contest timeline from database...</div>
          ) : !timelineData || contests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No contests synced yet. Click "Connect Platform" in the top bar to reconstruct live contest timelines!
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center bg-gray-50 p-3 border border-[#e1e1e1] rounded">
                <div>
                  <p className="font-bold text-sm text-gray-800">{timelineData.contest_name}</p>
                  <p className="text-gray-500 font-mono">Date: {timelineData.date} • Rank: #{timelineData.rank}</p>
                </div>
                <div className="text-right font-mono">
                  <p className="text-gray-500">Rating Change:</p>
                  <p className={`font-bold text-sm ${timelineData.rating_change >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {timelineData.rating_change >= 0 ? `+${timelineData.rating_change}` : timelineData.rating_change}
                  </p>
                </div>
              </div>

              {/* Time-Order Timeline Table */}
              <div className="space-y-2">
                <p className="font-bold text-gray-700">Submission Timeline (Time-Order):</p>
                {timelineData.timeline.length === 0 ? (
                  <div className="p-4 border border-dashed border-[#cccccc] text-center text-gray-500 rounded">
                    No individual problem submissions recorded for this contest.
                  </div>
                ) : (
                  <table className="cf-dense-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Problem</th>
                        <th>Verdict</th>
                        <th>AI Diagnostic Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timelineData.timeline.map((ev) => (
                        <tr key={ev.id}>
                          <td className="font-mono font-bold text-gray-700">{ev.time}</td>
                          <td className="font-bold text-blue-700">{ev.problem}</td>
                          <td>
                            <span className={ev.verdictType === 'accepted' ? 'verdict-ok' : 'verdict-wa'}>
                              {ev.verdict}
                            </span>
                          </td>
                          <td className="italic text-gray-700">{ev.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Average Solve Time by Problem Rating Section */}
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <span>→ Average Solve Time by Rating</span>
        </div>
        <div className="cf-panel-body p-3.5 space-y-3 text-xs">
          {/* Dual Tabs for Live Contest vs Overall */}
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
            <button
              onClick={() => setSolveTimeTab('live')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition ${
                solveTimeTab === 'live'
                  ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50/70'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⚡ Avg Solve Time — Live Contest
            </button>

            <button
              onClick={() => setSolveTimeTab('overall')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition ${
                solveTimeTab === 'overall'
                  ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50/70'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              📚 Avg Solve Time — Overall (incl. practice)
            </button>
          </div>

          {!isPlatformConnected ? (
            <div className="p-6 text-center text-gray-500 font-mono">
              Not Connected — sync this platform to see data
            </div>
          ) : avgSolveLoading ? (
            <div className="p-4 text-center text-gray-500">Computing average solve times by rating...</div>
          ) : activeData.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {solveTimeTab === 'live'
                ? "No official live contest solves recorded yet for this view. Practice solves are available in the 'Overall' tab!"
                : "No solved problems recorded yet across synced contests. Connect your platform handles to view solve speed analytics!"}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 font-medium leading-relaxed">
                {solveTimeTab === 'live'
                  ? "Computed ONLY from submissions during official live contest rounds (CONTESTANT). Reflects true live contest pressure and pacing speed."
                  : "Computed from all Accepted submissions regardless of contest participation type (includes practice & upsolving)."}
              </p>

              <table className="cf-dense-table">
                <thead>
                  <tr>
                    <th>Rating</th>
                    <th>Avg Solve Time</th>
                    <th>Problems Solved</th>
                    <th>Solve Speed Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  {activeData.map((row) => {
                    const maxSecs = Math.max(...activeData.map((r) => r.avg_time_seconds || 1));
                    const barPct = Math.min(100, Math.max(12, Math.round((row.avg_time_seconds / maxSecs) * 100)));
                    
                    const status = row.pace_status || "Optimal Pace";
                    const isOptimal = status === "Optimal Pace";
                    const isModerate = status === "Moderate Pace";

                    return (
                      <tr key={row.rating}>
                        <td className="font-bold font-mono text-blue-700">
                          {row.rating} ★
                        </td>
                        <td className="font-mono font-bold text-gray-800">
                          {row.formatted_avg_time}
                        </td>
                        <td className="font-mono text-gray-600">
                          {row.solved_count} {row.solved_count === 1 ? 'problem' : 'problems'}
                        </td>
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="w-44 bg-gray-200 h-2.5 rounded overflow-hidden">
                              <div
                                className={`h-full rounded transition-all duration-300 ${
                                  isOptimal
                                    ? 'bg-emerald-500'
                                    : isModerate
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                isOptimal
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : isModerate
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
