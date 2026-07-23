import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function LearningGraph() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningGraph();
  }, []);

  const loadLearningGraph = async () => {
    try {
      const data = await api.getLearningGraph();
      setNodes(data || []);
    } catch (err) {
      console.error("Failed to load learning graph:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'mastered') {
      return <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded border border-green-300">Mastered</span>;
    }
    if (status === 'weak') {
      return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-300">Weak Concept</span>;
    }
    if (status === 'unattempted') {
      return <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">Unattempted</span>;
    }
    return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">In Progress</span>;
  };

  return (
    <div className="space-y-4">
      <div className="cf-panel">
        <div className="cf-panel-header flex justify-between items-center">
          <span>→ Dynamic Concept Dependency Graph</span>
          <span className="text-xs text-gray-600 font-normal">Database Metric Classification</span>
        </div>
        <div className="cf-panel-body space-y-4">
          {loading ? (
            <div className="p-4 text-center text-xs text-gray-500">Classifying concept mastery nodes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-3 border rounded flex justify-between items-center ${
                    node.status === 'mastered'
                      ? 'border-green-300 bg-green-50/40'
                      : node.status === 'weak'
                      ? 'border-red-300 bg-red-50/40'
                      : node.status === 'unattempted'
                      ? 'border-slate-200 bg-slate-50/60'
                      : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-gray-800">{node.name}</p>
                    <p className="text-[11px] text-gray-500 font-mono">{node.level} • {node.count}</p>
                  </div>
                  <div>{getStatusBadge(node.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

