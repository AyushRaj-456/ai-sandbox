import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getRatingInfo } from '../utils/theme';
import { api } from '../services/api';

export default function Dashboard({ refreshKey }) {
  const [profile, setProfile] = useState(null);
  const [contests, setContests] = useState([]);
  const [platformStatus, setPlatformStatus] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      const [profData, statusData, contestData] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getPlatformStatus().catch(() => ({})),
        api.getContests().catch(() => [])
      ]);
      if (profData) setProfile(profData);
      if (statusData) setPlatformStatus(statusData);
      if (contestData) setContests(contestData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const cfRating = profile?.current_ratings?.codeforces || 0;
  const cfPeak = profile?.peak_ratings?.codeforces || 0;
  const lcRating = profile?.current_ratings?.leetcode || 0;
  const lcPeak = profile?.peak_ratings?.leetcode || 0;

  const hasConnected = platformStatus.codeforces === 'synced' || platformStatus.leetcode === 'synced';

  const ratingInfo = getRatingInfo(cfRating);
  const peakInfo = getRatingInfo(cfPeak);

  // Prepare chart data from contest history
  const chartData = contests.length > 0
    ? [...contests].reverse().slice(-10).map((c) => ({
        contest: c.name.length > 12 ? c.name.substring(0, 10) + "..." : c.name,
        rating: c.ratingAfter
      }))
    : [];

  const totalSolved = profile?.total_solved || 0;
  const contestCount = profile?.contest_count || 0;
  const handles = profile?.handles || {};

  return (
    <div className="space-y-4">
      {/* Platform Connection Alert Header */}
      {!hasConnected && (
        <div className="p-3 bg-[#fffbe6] border border-[#ffe58f] rounded flex justify-between items-center text-xs text-gray-800">
          <div>
            <span className="font-bold text-[#d48806]">→ Action Required:</span> No competitive platform connected. Connect your Codeforces handle to view live rating trajectories, contest histories, and mistake diagnostics.
          </div>
        </div>
      )}

      {/* Grid Row 1: Profile Summary & Unified Rating Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Handle & Rank Card */}
        <div className="cf-panel md:col-span-1">
          <div className="cf-panel-header flex justify-between items-center">
            <span>→ Competitive Profile</span>
            <span className="text-[10px] text-gray-500 font-normal">Scoped Session</span>
          </div>
          <div className="cf-panel-body space-y-3">
            <div>
              <p className="text-xl font-bold text-gray-900">{profile?.name || 'CP Competitor'}</p>

              {handles.codeforces ? (
                <p className={`text-base font-bold font-mono ${ratingInfo.textColor}`}>
                  {handles.codeforces} ({ratingInfo.title})
                </p>
              ) : (
                <p className="text-sm font-bold text-gray-400 font-mono">No Platform Connected</p>
              )}

              <p className="text-xs text-gray-500">{profile?.email || 'authenticated user'}</p>
            </div>

            <div className="border-t border-[#e1e1e1] pt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Connected Handles:</span>
                <span className="font-mono text-gray-800">
                  CF: {handles.codeforces || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Solved Problems:</span>
                <span className="font-mono font-bold text-green-700">{totalSolved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Contests Logged:</span>
                <span className="font-mono font-bold text-blue-700">{contestCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Multi-Platform Rating Bar */}
        <div className="cf-panel md:col-span-2">
          <div className="cf-panel-header">→ Multi-Platform Rating Metrics</div>
          <div className="cf-panel-body grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
            {/* Codeforces */}
            <div className="p-3 bg-gray-50 border border-[#e1e1e1] rounded space-y-1">
              <p className="text-xs font-bold text-[#03a89e]">Codeforces</p>
              <p className={`text-2xl font-bold font-mono ${ratingInfo.textColor}`}>
                {cfRating || '0'}
              </p>
              <p className="text-[11px] text-gray-500 font-mono">
                Peak: <span className="font-bold">{cfPeak || '0'}</span>
              </p>
            </div>

            {/* LeetCode */}
            <div className="p-3 bg-gray-50 border border-[#e1e1e1] rounded space-y-1">
              <p className="text-xs font-bold text-[#ff8c00]">LeetCode</p>
              <p className="text-2xl font-bold font-mono text-gray-800">
                {lcRating || '0'}
              </p>
              <p className="text-[11px] text-gray-500 font-mono">
                Peak: <span className="font-bold">{lcPeak || '0'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Live Rating Trajectory Chart */}
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <span>→ Codeforces Rating Progression Trajectory</span>
          <span className="text-[11px] text-gray-500 font-normal">Real Contest Ingestion</span>
        </div>
        <div className="cf-panel-body">
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e1e1e1" />
                  <XAxis dataKey="contest" stroke="#555555" fontSize={11} />
                  <YAxis domain={['auto', 'auto']} stroke="#555555" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#b9b9b9', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#3b5998"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b5998' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-xs text-gray-500 border border-dashed border-[#cccccc] rounded bg-gray-50">
              No rating progression data available yet. Connect your Codeforces handle to plot your live rating curve.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
