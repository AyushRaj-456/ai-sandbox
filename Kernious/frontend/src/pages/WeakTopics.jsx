import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function WeakTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopicData();
  }, []);

  const loadTopicData = async () => {
    try {
      const data = await api.getTopicAccuracy();
      setTopics(data || []);
    } catch (err) {
      console.error("Failed to load topic accuracy:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCell = (val) => {
    if (!val || val === "Not Connected") {
      return <span className="text-gray-400 italic text-[11px]">Not Connected</span>;
    }
    if (val === "No data yet") {
      return <span className="text-gray-400 text-[11px]">No data yet</span>;
    }
    return <span className="font-mono text-gray-800 font-semibold text-xs">{val}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <span>→ Weak Topics & Cross-Platform Accuracy Matrix</span>
          <span className="text-xs text-gray-600 font-normal">Real Submission Breakdown</span>
        </div>
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-500">Calculating topic accuracy matrix...</div>
          ) : topics.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">
              No submission data logged yet. Click "Connect Platform" in the top bar to analyze your topic accuracy across contest submissions!
            </div>
          ) : (
            <table className="cf-dense-table">
              <thead>
                <tr>
                  <th>Topic Name</th>
                  <th>Solve Accuracy %</th>
                  <th>Codeforces Metric</th>
                  <th>LeetCode Metric</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((t, idx) => (
                  <tr key={idx}>
                    <td className="font-bold text-blue-700">{t.topic}</td>
                    <td className="font-mono font-bold text-green-700">
                      {t.accuracy === "No data yet" ? (
                        <span className="text-gray-400 font-normal text-xs font-sans">No data yet</span>
                      ) : (
                        t.accuracy
                      )}
                    </td>
                    <td className="font-mono">{renderStatCell(t.cfStats)}</td>
                    <td className="font-mono">{renderStatCell(t.lcStats)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

