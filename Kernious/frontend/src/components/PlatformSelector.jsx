import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function PlatformSelector({ selectedPlatform, onChange, className = "" }) {
  const [statuses, setStatuses] = useState({
    codeforces: "not_connected",
    leetcode: "not_connected"
  });

  useEffect(() => {
    loadStatuses();
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

  const options = [
    { value: "all", label: "All Platforms", connected: true },
    { value: "codeforces", label: "Codeforces", connected: statuses.codeforces === "synced" },
    { value: "leetcode", label: "LeetCode", connected: statuses.leetcode === "synced" }
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label htmlFor="platform-select" className="text-xs font-bold text-gray-700 font-mono">Platform:</label>
      <select
        id="platform-select"
        value={selectedPlatform}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-mono bg-white border border-[#cccccc] px-2 py-1 rounded focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} {!opt.connected && opt.value !== "all" ? " (Not Connected)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
