import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Header from './Header';

export default function ProtectedRoute({
  userProfile,
  refreshKey,
  loadProfile,
  onOpenConnectModal,
  onLogout
}) {
  const token = localStorage.getItem('kernious_token');

  useEffect(() => {
    if (token && loadProfile) {
      loadProfile();
    }
  }, [token, refreshKey]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header
        userProfile={userProfile}
        onOpenConnectModal={onOpenConnectModal}
        onLogout={onLogout}
      />

      <main className="max-w-[1180px] mx-auto w-full px-4 py-4 flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-[#e1e1e1] py-3 text-center text-xs text-gray-500">
        <p>Kernious — Kernel + Ingenious</p>
      </footer>
    </div>
  );
}
