/**
 * Axios / Fetch API Client for Kernious
 * Connects React Frontend to FastAPI Backend
 * Uses VITE_API_BASE_URL env var in production or defaults to local server at http://127.0.0.1:8000
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem("kernious_token") || "";

  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  loginAuth: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (token) => request('/login', { method: 'POST', body: JSON.stringify({ token }) }),
  getProfile: () => request('/user/profile'),
  connectPlatform: (platform, handle) => request('/platform/connect', { method: 'POST', body: JSON.stringify({ platform, handle }) }),
  getPlatformStatus: () => request('/platform/status'),
  getContests: (platform) => request(`/contests${platform ? `?platform=${platform}` : ''}`),
  getContestDetail: (id) => request(`/contest/${id}`),
  getMistakes: (platform) => request(`/mistakes${platform ? `?platform=${platform}` : ''}`),
  attachMistakeCode: (mistakeId, sourceCode) => request(`/mistake/${mistakeId}/code`, { method: 'POST', body: JSON.stringify({ source_code: sourceCode }) }),
  getRecommendations: () => request('/recommendations'),
  generateReport: (tier) => request(`/report/generate?milestone_tier=${tier}`, { method: 'POST' }),
  getReport: (id) => request(`/report/${id}`),
  chatWithCoach: (message, history) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
  saveNote: (problem_id, user_note, learning = "", shortcut = "") => request('/notes', { method: 'POST', body: JSON.stringify({ problem_id, user_note, learning, shortcut }) }),
  getNotes: () => request('/notes'),
  getTopicAccuracy: () => request('/topics/accuracy'),
  getLearningGraph: () => request('/learning-graph'),
  getContestTimeline: (contestId) => request(`/contest/${contestId}/timeline`),
  getAvgSolveTimeByRating: (platform) => request(`/analytics/avg-solve-time-by-rating${platform ? `?platform=${platform}` : ''}`),
  getTotalUsers: () => request('/stats/total-users')
};
