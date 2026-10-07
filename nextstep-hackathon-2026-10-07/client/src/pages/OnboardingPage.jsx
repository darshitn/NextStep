import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoalForm from '../components/GoalForm.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { apiService } from '../services/apiService.js';

export default function OnboardingPage({ onGoalUpdated }) {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function checkExistingGoal() {
      try {
        const res = await apiService.getGoal();
        if (mounted && res?.data?.goal) {
          onGoalUpdated(res.data.goal);
          navigate('/dashboard');
        }
      } catch (err) {
        // Not fatal; user may be fresh
        console.log('No existing goal loaded:', err);
      } finally {
        if (mounted) setIsInitializing(false);
      }
    }
    checkExistingGoal();
    return () => { mounted = false; };
  }, [navigate, onGoalUpdated]);

  const handleCreateGoal = async (payload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiService.createGoal(payload);
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Goal creation error:', err);
      if (err.status === 409 || err.code === 'GOAL_EXISTS') {
        // Goal already exists, reload and go to dashboard
        try {
          const fresh = await apiService.getGoal();
          if (fresh?.data?.goal) {
            onGoalUpdated(fresh.data.goal);
            navigate('/dashboard');
            return;
          }
        } catch (reloadErr) {
          console.error('Failed to reload existing goal:', reloadErr);
        }
      }
      setError(err.message || 'Failed to initialize practice plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return <LoadingState message="Checking existing practice goals..." />;
  }

  return (
    <div className="py-4 sm:py-8">
      {error && (
        <div className="max-w-2xl mx-auto mb-4">
          <ErrorNotice error={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <GoalForm
        onSubmit={handleCreateGoal}
        isLoading={isSubmitting}
        error={error}
      />
    </div>
  );
}
