import React, { useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(!goal);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [failedOperation, setFailedOperation] = useState('load');
  const [lastAvailability, setLastAvailability] = useState(null);

  useEffect(() => {
    if (goal) { setIsLoading(false); return; }
    let mounted = true;
    setIsLoading(true);
    setError(null);
    apiService.getGoal().then(res => {
      if (!mounted) return;
      if (res?.data?.goal) onGoalUpdated(res.data.goal);
      else navigate('/onboarding', { replace: true });
    }).catch(err => {
      if (mounted) { setFailedOperation('load'); setError(err.message || 'Could not load your saved plan.'); }
    }).finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, [goal, onGoalUpdated, navigate, loadAttempt]);

  const handlePreviewRecovery = async (availability) => {
    setLastAvailability(availability);
    setFailedOperation('preview');
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
        setFailedOperation('reload');
        setError('Goal version changed in another session. Please reload the dashboard.');
      } else {
        setError(err.message || 'Failed to compute recovery preview.');
      }
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApplyRecovery = async (availability, previewForDate) => {
    setFailedOperation('apply');
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
        setFailedOperation('reload');
        setError('Recovery conflict: the schedule or date changed since your preview was calculated. Please regenerate a fresh preview.');
        setPreviewData(null);
      } else {
        setError(err.message || 'Failed to apply recovery plan.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleRetry = async () => {
    if (!goal) { setLoadAttempt(attempt => attempt + 1); return; }
    if (failedOperation === 'preview' && lastAvailability) {
      return handlePreviewRecovery(lastAvailability);
    }
    // An interrupted write may already have saved. Reload instead of repeating it.
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.getGoal();
      if (res?.data?.goal) { onGoalUpdated(res.data.goal); navigate('/dashboard'); }
      else navigate('/onboarding');
    } catch (err) { setError(err.message || 'Could not reload your saved plan.'); }
    finally { setIsLoading(false); }
  };

  if (isLoading) return <LoadingState message="Loading your saved plan..." />;
  if (!goal) return <ErrorNotice error={error || 'Could not load your saved plan.'} onRetry={handleRetry} retryLabel="Retry loading plan" />;

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
          onRetry={handleRetry}
          retryLabel={failedOperation === 'preview' ? 'Retry preview' : 'Reload saved plan'}
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
