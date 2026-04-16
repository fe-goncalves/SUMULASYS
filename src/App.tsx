/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Athletes from './pages/Athletes';
import Committee from './pages/Committee';
import Tournaments from './pages/Tournaments';
import TournamentDetail from './pages/TournamentDetail';
import Matches from './pages/Matches';
import MatchDetail from './pages/MatchDetail';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/teams" replace />} />
        <Route path="teams" element={<Teams />} />
        <Route path="teams/:id" element={<TeamDetail />} />
        <Route path="athletes" element={<Athletes />} />
        <Route path="committee" element={<Committee />} />
        <Route path="tournaments" element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentDetail />} />
        <Route path="matches" element={<Matches />} />
        <Route path="matches/:id" element={<MatchDetail />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <CacheProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </CacheProvider>
  );
}
