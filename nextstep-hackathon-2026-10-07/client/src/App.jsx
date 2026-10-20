import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AppShell from './components/AppShell.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { createLazyView } from './components/workspace/AsyncViewBoundary.jsx';

const OnboardingPage = createLazyView(
  () => import('./pages/OnboardingPage.jsx'),
  'Onboarding'
);
const RecoveryPage = createLazyView(
  () => import('./pages/RecoveryPage.jsx'),
  'Schedule Recovery'
);
const NotFoundPage = createLazyView(
  () => import('./pages/NotFoundPage.jsx'),
  'Page Not Found'
);
import LoadingState from './components/LoadingState.jsx';
import ErrorNotice from './components/ErrorNotice.jsx';
import { apiService, isFixtureMode, onSessionExpired } from './services/apiService.js';

export default function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [goal, setGoal] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authAttempt, setAuthAttempt] = useState(0);

  // Subscribe to session expiration events across all API requests
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setSessionExpired(true);
      setUser(null);
      setGoal(null);
      setCatalog(null);
      setAuthError(null);
      navigate('/login');
    });
    return unsubscribe;
  }, [navigate]);

  // Check existing session on load
  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      setIsAuthChecking(true);
      setAuthError(null);
      try {
        const currentUser = await apiService.getCurrentUser();
        if (mounted && currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        if (mounted && err.status !== 401 && err.code !== 'UNAUTHORIZED') {
          setAuthError(err.message || 'Could not check your session. Please retry.');
        }
      } finally {
        if (mounted) setIsAuthChecking(false);
      }
    }
    checkAuth();
    return () => { mounted = false; };
  }, [authAttempt]);

  const handleSignOut = async () => {
    try {
      await apiService.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setGoal(null);
    setCatalog(null);
    navigate('/login');
  };

  const handleUserAuthenticated = (authenticatedUser) => {
    if (user?.id !== authenticatedUser?.id) {
      setGoal(null);
      setCatalog(null);
    }
    setUser(authenticatedUser);
    setSessionExpired(false);
    setAuthError(null);
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center ui-bg-page">
        <LoadingState message="Connecting to NextStep..." />
      </div>
    );
  }

  if (authError) {
    return <AppShell user={null} isFixtureMode={isFixtureMode}>
      <ErrorNotice error={authError} onRetry={() => setAuthAttempt(attempt => attempt + 1)} />
    </AppShell>;
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
                user={user}
                goal={goal}
                onGoalUpdated={setGoal}
                catalog={catalog}
                onCatalogLoaded={setCatalog}
              />
            )
          }
        />

        {/* Protected Direct Atlas / Proof / Practice Routes */}
        <Route
          path="/atlas"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <DashboardPage
                user={user}
                goal={goal}
                onGoalUpdated={setGoal}
                catalog={catalog}
                onCatalogLoaded={setCatalog}
                initialView="atlas"
              />
            )
          }
        />
        <Route
          path="/atlas/:topicSlug"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <DashboardPage
                user={user}
                goal={goal}
                onGoalUpdated={setGoal}
                catalog={catalog}
                onCatalogLoaded={setCatalog}
                initialView="atlas"
              />
            )
          }
        />
        <Route
          path="/learn/:lessonId"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <DashboardPage
                user={user}
                goal={goal}
                onGoalUpdated={setGoal}
                catalog={catalog}
                onCatalogLoaded={setCatalog}
                initialView="proof"
              />
            )
          }
        />
        <Route
          path="/practice"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <DashboardPage
                goal={goal}
                onGoalUpdated={setGoal}
                catalog={catalog}
                onCatalogLoaded={setCatalog}
                initialView="practice"
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
