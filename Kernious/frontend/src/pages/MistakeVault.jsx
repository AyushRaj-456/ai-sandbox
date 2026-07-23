import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Code, Save, Sparkles, CheckCircle2, FileCode } from 'lucide-react';
import PlatformSelector from '../components/PlatformSelector';

export default function MistakeVault() {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [platform, setPlatform] = useState('all');
  const [statuses, setStatuses] = useState({
    codeforces: "not_connected",
    leetcode: "not_connected"
  });
  
  // Code attachment states
  const [editingCodeIds, setEditingCodeIds] = useState(new Set());
  const [codeInputs, setCodeInputs] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadStatuses();
    loadMistakes();
  }, [platform]);

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

  const loadMistakes = async () => {
    setLoading(true);
    try {
      const data = await api.getMistakes(platform);
      const list = data || [];
      setMistakes(list);

      // Pre-fill existing source code inputs
      const initialInputs = {};
      list.forEach((m) => {
        if (m.source_code) {
          initialInputs[m.id] = m.source_code;
        }
      });
      setCodeInputs(initialInputs);
    } catch (err) {
      console.error("Failed to load mistakes:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const toggleCodeEdit = (id) => {
    const next = new Set(editingCodeIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setEditingCodeIds(next);
  };

  const handleSaveCode = async (mId) => {
    const codeText = codeInputs[mId] || '';
    if (!codeText.trim()) return;

    setSavingId(mId);
    try {
      const res = await api.attachMistakeCode(mId, codeText);
      if (res && res.status === 'success') {
        // Update local mistakes list with newly generated contrastive hints
        setMistakes((prev) =>
          prev.map((m) =>
            m.id === mId
              ? {
                  ...m,
                  missed_concept: res.missed_concept,
                  thinking_direction: res.thinking_direction,
                  direction_not_to_go: res.direction_not_to_go,
                  source_code: res.source_code
                }
              : m
          )
        );
        // Close editor box
        const next = new Set(editingCodeIds);
        next.delete(mId);
        setEditingCodeIds(next);
      }
    } catch (err) {
      console.error("Failed to save code:", err);
    } finally {
      setSavingId(null);
    }
  };

  const filtered = mistakes.filter(
    (m) =>
      m.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPlatformConnected = platform === 'all' || statuses[platform] === 'synced';

  return (
    <div className="space-y-4">
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span>→ Personal Mistake Database & Problem Notes</span>
            <PlatformSelector selectedPlatform={platform} onChange={setPlatform} />
          </div>
          <input
            type="text"
            placeholder="Filter mistakes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-0.5 border border-[#cccccc] rounded text-xs text-gray-800"
          />
        </div>
        <div className="p-0 overflow-x-auto">
          {!isPlatformConnected ? (
            <div className="p-6 text-center text-xs text-gray-500 font-mono">
              Not Connected — sync this platform to see data
            </div>
          ) : loading ? (
            <div className="p-4 text-center text-xs text-gray-500">Loading mistake vault...</div>
          ) : mistakes.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 font-mono">
              {platform === "all" ? (
                "No mistakes logged yet. Connect your platform handles to auto-classify failed submission logs into your mistake vault!"
              ) : platform === "codeforces" ? (
                "No Codeforces mistakes logged yet. Failed submissions are auto-classified when you sync."
              ) : (
                "No LeetCode mistakes logged yet. Note: LeetCode public sync only retrieves solved problems, so failed submissions are not automatically classified. You can add notes for solved problems in the Contests tab!"
              )}
            </div>
          ) : (
            <table className="cf-dense-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Error Category</th>
                  <th>Linked Problem</th>
                  <th>Platform</th>
                  <th>Concept</th>
                  <th>Verdict Tag</th>
                  <th>Source Status</th>
                  <th>Solution Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => {
                  const mId = m.id || idx;
                  const isExpanded = expandedIds.has(mId);
                  const isEditingCode = editingCodeIds.has(mId);
                  const hasSource = Boolean(m.source_code);

                  return (
                    <React.Fragment key={mId}>
                      <tr
                        onClick={() => toggleExpand(mId)}
                        className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                      >
                        <td className="text-center font-bold text-gray-500 select-none">
                          {isExpanded ? '▼' : '►'}
                        </td>
                        <td className="font-bold text-red-600">{m.category}</td>
                        <td className="font-bold text-blue-700">{m.problem}</td>
                        <td className="font-mono text-xs text-gray-600">{m.platform}</td>
                        <td>{m.concept}</td>
                        <td>
                          <span className={m.verdict === 'WA' ? 'verdict-wa' : 'verdict-tle'}>
                            {m.verdict}
                          </span>
                        </td>
                        <td>
                          {hasSource ? (
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 shrink-0" /> Attached
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px] italic">Not attached</span>
                          )}
                        </td>
                        <td className="italic text-gray-800">{m.note}</td>
                      </tr>

                      {/* Accordion Expanded Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50 border-t border-b border-blue-100">
                          <td colSpan={8} className="p-4 space-y-3">
                            <div className="p-3.5 bg-white border border-blue-200 rounded shadow-sm space-y-3 text-xs">
                              {/* Header Row with Actions */}
                              <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                                <div className="flex items-center">
                                  <span className="font-bold text-blue-900 text-sm">
                                    Contrastive AI Analysis — {m.problem}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCodeEdit(mId);
                                  }}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs transition"
                                >
                                  <Code className="w-3.5 h-3.5" />
                                  <span>{hasSource ? (isEditingCode ? 'Close Code Editor' : 'Edit Submitted Code') : (isEditingCode ? 'Close Editor' : 'Attach Your Code')}</span>
                                </button>
                              </div>

                              {/* Code Editor Box */}
                              {isEditingCode && (
                                <div className="p-3 bg-[#1e293b] border border-slate-700 rounded space-y-2 text-white">
                                  <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                                    <span>Paste your submitted code for {m.problem}:</span>
                                    <span>Supported: C++, Python, Java</span>
                                  </div>
                                  <textarea
                                    rows={8}
                                    value={codeInputs[mId] || ''}
                                    onChange={(e) => setCodeInputs({ ...codeInputs, [mId]: e.target.value })}
                                    placeholder="// Paste exact code submitted to Codeforces here..."
                                    className="w-full p-2.5 bg-[#0f172a] border border-slate-700 rounded font-mono text-xs text-emerald-400 focus:outline-none focus:border-blue-500"
                                  />
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      disabled={savingId === mId}
                                      onClick={() => handleSaveCode(mId)}
                                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition"
                                    >
                                      <Save className="w-3.5 h-3.5" />
                                      <span>{savingId === mId ? 'Analyzing Code...' : 'Save Code & Regenerate AI Review'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 2-Column Side-by-Side Contrastive Thinking (When Code is Attached) */}
                              {hasSource ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Left Column: Your Actual Code Logic */}
                                    <div className="p-3 bg-red-50/70 border border-red-200 rounded space-y-1">
                                      <p className="font-bold text-red-800 text-xs flex items-center gap-1.5">
                                        <FileCode className="w-4 h-4 text-red-600 shrink-0" />
                                        <span>Your Actual Code Logic (What it does)</span>
                                      </p>
                                      <p className="text-gray-800 leading-relaxed text-xs">{m.missed_concept}</p>
                                    </div>

                                    {/* Right Column: Corrected Reasoning & Invariants */}
                                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded space-y-1">
                                      <p className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span>What Was Needed (Corrected Reasoning)</span>
                                      </p>
                                      <p className="text-gray-800 leading-relaxed text-xs">{m.thinking_direction}</p>
                                    </div>
                                  </div>

                                  {/* Instinct / Direction NOT to go Box */}
                                  {m.direction_not_to_go && (
                                    <div className="p-2.5 bg-purple-50/60 border border-purple-200 rounded text-xs space-y-0.5">
                                      <p className="font-bold text-purple-800">Direction NOT to go (Instinct to Avoid):</p>
                                      <p className="text-gray-800 leading-relaxed">{m.direction_not_to_go}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Fallback View (When Code is NOT Attached) */
                                <div className="space-y-3">
                                  {m.missed_concept && (
                                    <div>
                                      <p className="font-bold text-amber-700">What you may have missed:</p>
                                      <p className="text-gray-800 mt-0.5 leading-relaxed">{m.missed_concept}</p>
                                    </div>
                                  )}

                                  {m.thinking_direction && (
                                    <div>
                                      <p className="font-bold text-emerald-700">Direction to think in:</p>
                                      <p className="text-gray-800 mt-0.5 leading-relaxed">{m.thinking_direction}</p>
                                    </div>
                                  )}

                                  {m.direction_not_to_go && (
                                    <div>
                                      <p className="font-bold text-rose-700">Direction NOT to go:</p>
                                      <p className="text-gray-800 mt-0.5 leading-relaxed">{m.direction_not_to_go}</p>
                                    </div>
                                  )}

                                  {/* Bright Attention-Drawing Call-To-Action Banner (No Redundant Button) */}
                                  <div className="p-3 bg-amber-50 border border-amber-400 rounded-md shadow-xs">
                                    <p className="text-amber-950 font-medium text-xs leading-relaxed">
                                      <span className="font-bold text-amber-800">Attach your code for a precise, line-by-line breakdown</span> — and every mistake you save here sharpens your future advice, weak-topic scores, and milestone reports.
                                    </p>
                                  </div>
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


