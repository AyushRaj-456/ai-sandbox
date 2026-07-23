import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function MilestoneReports() {
  const [selectedMilestone, setSelectedMilestone] = useState(20);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport(selectedMilestone);
  }, [selectedMilestone]);

  const loadReport = async (tier) => {
    setLoading(true);
    try {
      const data = await api.getReport(tier);
      setReport(data);
    } catch (err) {
      console.error("Failed to load report:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeReport = report || {
    title: `After ${selectedMilestone} Contests — Milestone Assessment`,
    summary: 'No platform connected yet. Connect your Codeforces handle to generate milestone reports.',
    strengths: [],
    weaknesses: [],
    plan: 'Connect a platform handle to enable AI skill evaluation.'
  };

  const hasData = (activeReport.strengths && activeReport.strengths.length > 0) || (activeReport.weaknesses && activeReport.weaknesses.length > 0);

  return (
    <div className="space-y-4">
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <span>→ Milestone Reports System (Unlocked at 5, 10, 20, 50 Contests)</span>
          <div className="flex space-x-1">
            {[5, 10, 20, 50].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMilestone(m)}
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  selectedMilestone === m ? 'bg-[#3b5998] text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {m} Contests
              </button>
            ))}
          </div>
        </div>
        <div className="cf-panel-body space-y-3 text-xs">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Generating milestone report...</div>
          ) : (
            <>
              <p className="font-bold text-base text-gray-800">{activeReport.title}</p>
              <p className="text-gray-500 font-mono">Generated on {new Date().toLocaleDateString()}</p>
              <div className="p-3 bg-[#f0f4f8] border-l-4 border-[#3b5998] italic text-gray-800">
                "{activeReport.summary}"
              </div>

              {hasData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-gray-50 border border-[#e1e1e1] rounded space-y-1">
                    <p className="font-bold text-green-700">Confirmed Strengths:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {(activeReport.strengths || []).map((s, idx) => <li key={idx}>{s}</li>)}
                    </ul>
                  </div>

                  <div className="p-3 bg-gray-50 border border-[#e1e1e1] rounded space-y-1">
                    <p className="font-bold text-orange-600">Areas Requiring Practice:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      {(activeReport.weaknesses || []).map((w, idx) => <li key={idx}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-[#e1e1e1] rounded text-center text-gray-500">
                  Connect your Codeforces handle to unlock automated milestone skill analysis.
                </div>
              )}

              <div className="p-3 bg-[#e8f4f8] border border-[#03a89e] rounded space-y-1 font-mono">
                <p className="font-bold text-[#03a89e]">Personal Training Plan:</p>
                <p className="text-gray-800">{activeReport.plan}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
