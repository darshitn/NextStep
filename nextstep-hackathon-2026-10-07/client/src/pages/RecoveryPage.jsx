import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RecoveryComparison from '../components/RecoveryComparison.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { apiService } from '../services/apiService.js';
import { ArrowLeft } from 'lucide-react';

export default function RecoveryPage({ goal, onGoalUpdated }) {
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);

  if (!goal) {
    navigate('/onboarding');
    return null;
  }

  const handlePreviewRecovery = async (availability) => {
    setIsPreviewing(true);
    setError(null);
    try {
      const res = await apiService.previewRecovery({
        expectedVersion: goal.version,
        availability
      });
      if (res?.data?.preview) {
        setPreviewData(res.data.preview);
      }
    } catch (err) {
      console.error('Preview recovery error:', err);
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setError('Goal version changed in another session. Please reload the dashboard.');
      } else {
        setError(err.message || 'Failed to compute recovery preview.');
      }
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApplyRecovery = async (availability, previewForDate) => {
    setIsApplying(true);
    setError(null);
    try {
      const res = await apiService.applyRecovery({
        expectedVersion: goal.version,
        previewForDate,
        availability
      });
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Apply recovery error:', err);
      if (err.status === 409) {
        setError('Recovery conflict: the schedule or date changed since your preview was calculated. Please regenerate a fresh preview.');
        setPreviewData(null);
      } else {
        setError(err.message || 'Failed to apply recovery plan.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2 animate-fade-in">
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold ui-text-muted hover:ui-text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>

      {error && (
        <ErrorNotice
          error={error}
          onDismiss={() => setError(null)}
          onRetry={() => {
            setError(null);
            if (previewData) {
              handleApplyRecovery(previewData.availability, previewData.previewForDate);
            }
          }}
        />
      )}

      <RecoveryComparison
        goal={goal}
        previewData={previewData}
        onPreviewRecovery={handlePreviewRecovery}
        onApplyRecovery={handleApplyRecovery}
        onCancel={() => navigate('/dashboard')}
        isPreviewing={isPreviewing}
        isApplying={isApplying}
        error={error}
      />
    </div>
  );
}
