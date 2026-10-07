import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RecoveryPage from './pages/RecoveryPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import LoadingState from './components/LoadingState.jsx';
import { apiService, isFixtureMode, onSessionExpired } from './services/apiService.js';

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [goal, setGoal] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Subscribe to session expiration events across all API requests
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setSessionExpired(true);
      setUser(null);
      setGoal(null);
      navigate('/login');
    });
    return unsubscribe;
  }, [navigate]);

  // Check existing session on load
  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const currentUser = await apiService.getCurrentUser();
        if (mounted && currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    }
    checkAuth();
    return () => { mounted = false; };
  }, []);

  const handleSignOut = async () => {
    try {
      await apiService.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setGoal(null);
    navigate('/login');
  };

  const handleUserAuthenticated = (authenticatedUser) => {
    setUser(authenticatedUser);
    setSessionExpired(false);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingState message="Connecting to NextStep..." />
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      onSignOut={handleSignOut}
      isFixtureMode={isFixtureMode}
      sessionExpired={sessionExpired}
      onRenewSession={() => navigate('/login')}
    >
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onUserAuthenticated={handleUserAuthenticated} />
            )
          }
        />

        {/* Protected Onboarding */}
        <Route
          path="/onboarding"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <OnboardingPage onGoalUpdated={setGoal} />
            )
          }
        />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <DashboardPage
                goal={goal}
                onGoalUpdated={setGoal}
                catalog={catalog}
                onCatalogLoaded={setCatalog}
              />
            )
          }
        />

        {/* Protected Recovery */}
        <Route
          path="/recovery"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <RecoveryPage goal={goal} onGoalUpdated={setGoal} />
            )
          }
        />

        {/* Root Redirect */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
