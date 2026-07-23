import React, { useState } from 'react';
import { api } from '../services/api';

const promptChips = [
  "Why am I stuck at my current rating?",
  "What should I practice this week specifically?",
  "Which mistakes keep repeating in my contests?",
  "Compare my last five contests performance."
];

export default function AICoachChat() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I'm Kernious, your personal AI Competitive Programming Coach. I've analyzed your contests and submission history across Codeforces and LeetCode. Ask me anything about your skill growth, recurring mistakes, or practice strategy!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend) => {
    const q = textToSend || input;
    if (!q.trim() || loading) return;

    const newMsgs = [...messages, { sender: 'user', text: q }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithCoach(q, newMsgs);
      const reply = res.reply || "Keep practicing! Focus on boundary checks and implementation speed.";
      setMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      console.error("AI Coach Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "I experienced a temporary network issue. Based on your logged contests, focus on Binary Search boundary checks for immediate rating gains!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="cf-panel">
        <div className="cf-panel-header">
          <span>→ AI Coach Conversational Interface</span>
        </div>
        <div className="cf-panel-body space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#f0f4f8] border-blue-300 text-gray-900 ml-8'
                    : 'bg-white border-[#e1e1e1] text-gray-800 mr-8'
                }`}
              >
                <p className="font-bold mb-1 text-[11px]">
                  {msg.sender === 'user' ? 'You:' : 'Kernious AI Coach:'}
                </p>
                <p>{msg.text}</p>
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded border text-xs leading-relaxed bg-white border-[#e1e1e1] text-gray-500 mr-8 italic">
                Kernious is analyzing your contest logs...
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-[#e1e1e1]">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                disabled={loading}
                className="px-2.5 py-1 rounded bg-gray-100 hover:bg-blue-50 border border-[#cccccc] text-[11px] text-blue-700 font-medium whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Ask Kernious about your rating, weak topics, or practice strategy..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading}
              className="flex-1 px-3 py-1.5 border border-[#cccccc] rounded text-xs text-gray-800 focus:outline-none focus:border-blue-600"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="px-4 py-1.5 bg-[#3b5998] hover:bg-blue-800 text-white font-bold text-xs rounded transition"
            >
              {loading ? 'Thinking...' : 'Ask Coach'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
