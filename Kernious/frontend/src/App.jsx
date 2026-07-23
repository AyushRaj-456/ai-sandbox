import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectPlatformModal from './components/ConnectPlatformModal';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ContestHistory from './pages/ContestHistory';
import ReplayView from './pages/ReplayView';
import MistakeVault from './pages/MistakeVault';
import WeakTopics from './pages/WeakTopics';
import AICoachChat from './pages/AICoachChat';
import { api } from './services/api';

export default function App() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadProfile = async () => {
    try {
      const prof = await api.getProfile();
      setUserProfile(prof);
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('token')) {
        handleLogout();
      }
    }
  };

  const handleAuthSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('kernious_token');
    localStorage.removeItem('kernious_user');
    setUserProfile(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handlePlatformSynced = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Router>
      <Routes>
        {/* Dedicated Standalone Login Page */}
        <Route
          path="/login"
          element={<LoginPage onAuthSuccess={handleAuthSuccess} />}
        />

        {/* Protected App Routes - App Layout unmounts when logged out */}
        <Route
          element={
            <ProtectedRoute
              userProfile={userProfile}
              refreshKey={refreshKey}
              loadProfile={loadProfile}
              onOpenConnectModal={() => setIsConnectModalOpen(true)}
              onLogout={handleLogout}
            />
          }
        >
          <Route path="/" element={<Dashboard refreshKey={refreshKey} />} />
          <Route path="/contests" element={<ContestHistory refreshKey={refreshKey} />} />
          <Route path="/contest-detail" element={<Navigate to="/contests" replace />} />
          <Route path="/time-analysis" element={<ReplayView />} />
          <Route path="/replay" element={<Navigate to="/time-analysis" replace />} />
          <Route path="/mistakes" element={<MistakeVault />} />
          <Route path="/weak-topics" element={<WeakTopics />} />
          <Route path="/learning-graph" element={<Navigate to="/" replace />} />
          <Route path="/ai-coach" element={<AICoachChat />} />
          <Route path="/milestones" element={<Navigate to="/" replace />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Sync Handles Modal */}
      <ConnectPlatformModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onPlatformSynced={handlePlatformSynced}
      />
    </Router>
  );
}
