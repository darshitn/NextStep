import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressSummary from '../components/ProgressSummary.jsx';
import PracticeActivity from '../components/PracticeActivity.jsx';
import { activityByDay } from '../services/activity.js';
import MissionCard from '../components/MissionCard.jsx';
import CompletionForm from '../components/CompletionForm.jsx';
import GuidancePanel from '../components/GuidancePanel.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { apiService } from '../services/apiService.js';
import { RefreshCw, Compass, SlidersHorizontal, CheckCircle2, ListOrdered, Calendar } from 'lucide-react';

export default function DashboardPage({ goal, onGoalUpdated, catalog, onCatalogLoaded }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(!goal || !catalog);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [savedNotice, setSavedNotice] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const saveName = async (event) => {
    event.preventDefault();
    setSavingName(true); setError(null);
    try {
      const response = await apiService.renameGoal({ goalName: draftName.trim(), expectedVersion: goal.version });
      onGoalUpdated(response.data.goal);
      setEditingName(false); setGuidanceData(null);
      setSavedNotice('Goal name saved. Your missions and progress are unchanged.');
    } catch (err) { setError(err.message || 'Could not save goal name.'); }
    finally { setSavingName(false); }
  };

  // Active mission interactive modals/panels
  const [activeCompletingMission, setActiveCompletingMission] = useState(null);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  const [activeGuidanceMission, setActiveGuidanceMission] = useState(null);
  const [guidanceData, setGuidanceData] = useState(null);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [guidanceError, setGuidanceError] = useState(null);

  // Load Goal & Catalog if missing
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setError(null);
        let currentGoal = goal;
        let currentCatalog = catalog;

        if (!currentCatalog) {
          const catRes = await apiService.getCatalog();
          currentCatalog = catRes.data;
          if (mounted) onCatalogLoaded(currentCatalog);
        }

        if (!currentGoal) {
          const goalRes = await apiService.getGoal();
          currentGoal = goalRes?.data?.goal;
          if (!currentGoal) {
            if (mounted) navigate('/onboarding');
            return;
          }
          if (mounted) onGoalUpdated(currentGoal);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        if (mounted) setError(err.message || 'Failed to load dashboard data.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [goal, catalog, navigate, onGoalUpdated, onCatalogLoaded]);

  // Refresh goal handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await apiService.getGoal();
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        // Invalidate stale guidance if version changed
        if (guidanceData && guidanceData.baseVersion !== res.data.goal.version) {
          setGuidanceData(null);
        }
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError(err.message || 'Failed to refresh practice plan.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Completion submission handler
  const handleCompleteMission = async ({ missionId, outcome, reflection }) => {
    setIsSubmittingCompletion(true);
    setError(null);
    try {
      const res = await apiService.completeMission({
        missionId,
        expectedVersion: goal.version,
        outcome,
        reflection
      });

      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        setActiveCompletingMission(null);
        setSavedNotice(`Saved. ${Object.keys(res.data.goal.completions || {}).length} of ${catalog.missions.length} missions complete. Your activity is updated below.`);
        // Ephemeral guidance invalidated upon completion of mission
        setGuidanceData(null);
        setActiveGuidanceMission(null);
      }
    } catch (err) {
      console.error('Completion error:', err);
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setError('Your practice plan was updated in another session. Refreshing latest state...');
        handleRefresh();
      } else {
        setError(err.message || 'Failed to record mission completion.');
      }
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // Guidance request handler
  const handleRequestGuidance = async ({ missionId, category, feedback }) => {
    setIsLoadingGuidance(true);
    setGuidanceError(null);
    try {
      const res = await apiService.getGuidance({
        expectedVersion: goal.version,
        missionId,
        category,
        feedback
      });

      if (res?.data?.guidance) {
        setGuidanceData(res.data.guidance);
      }
    } catch (err) {
      console.error('Guidance error:', err);
      setGuidanceError(err);
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  if (isLoading || !goal || !catalog) {
    return <LoadingState message="Loading your practice dashboard..." />;
  }

  const missions = catalog.missions || [];
  const completions = goal.completions || {};
  const currentMission = missions.find(m => m.id === goal.nextMissionId);

  // Map schedules to lookup
  const scheduleMap = {};
  (goal.schedule || []).forEach(item => {
    scheduleMap[item.missionId] = item.date;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {editingName && <form onSubmit={saveName} className="rounded-xl border ui-border-border ui-bg-surface p-4 space-y-3">
        <label htmlFor="rename-goal" className="block text-sm ui-text-ink">Your goal name</label>
        <input id="rename-goal" required maxLength={80} value={draftName} onChange={e => setDraftName(e.target.value)} className="w-full rounded-lg ui-bg-surface border ui-border-border p-3 ui-text-ink" />
        <p className="text-xs ui-text-muted">Naming your goal does not change the DSA Foundations curriculum.</p>
        <button disabled={savingName || !draftName.trim()} className="px-4 py-2 ui-bg-accent ui-text-inverse rounded-lg disabled:opacity-50">{savingName ? 'Saving...' : 'Save goal name'}</button>
        <button type="button" disabled={savingName} onClick={() => setEditingName(false)} className="ml-3 ui-text-ink">Cancel</button>
      </form>}
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ui-border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold ui-text-ink tracking-tight">
            {goal.goalName || 'Build my DSA foundations'}
          </h1>
          <p className="text-xs ui-text-muted mt-0.5">
            Your next step, your week, your progress. Current track: DSA Foundations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button onClick={() => { setDraftName(goal.goalName || 'Build my DSA foundations'); setEditingName(true); }} className="px-3 py-1.5 text-xs ui-text-ink rounded-xl border ui-border-border">Name my goal</button>
          {goal.status !== 'completed' && <button
            onClick={() => navigate('/recovery')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ui-bg-surface hover:ui-bg-soft border ui-border-border text-xs font-semibold ui-text-ink transition-all hover:ui-border-border-a40"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 ui-text-ink" />
            <span>Adjust my week</span>
          </button>}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl ui-bg-surface hover:ui-bg-soft border ui-border-border ui-text-ink hover:ui-text-ink transition-all disabled:opacity-50"
            title="Refresh saved goal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <ErrorNotice error={error} onDismiss={() => setError(null)} onRetry={handleRefresh} />
      )}

      {/* Progress Summary Card */}
      <ProgressSummary goal={goal} totalMissions={missions.length} />
      {savedNotice && <p role="status" className="rounded-xl border ui-border-border-a30 ui-bg-soft-a10 px-4 py-3 text-sm ui-text-ink">{savedNotice}</p>}

      {/* Active Mission Section */}
      {currentMission ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider ui-text-ink flex items-center gap-2">
              <Compass className="w-4 h-4 ui-text-ink" />
              <span>Your next step</span>
            </h2>
          </div>

          <MissionCard
            mission={currentMission}
            isCurrent={true}
            isCompleted={false}
            scheduledDate={scheduleMap[currentMission.id]}
            onComplete={() => setActiveCompletingMission(currentMission)}
            onOpenGuidance={() => {
              setActiveGuidanceMission(currentMission);
              // reset guidance data when opening freshly if mission changed
              if (guidanceData && guidanceData.missionId !== currentMission.id) {
                setGuidanceData(null);
              }
            }}
          />

          {/* AI Guidance Drawer / Panel */}
          {activeGuidanceMission && (
            <GuidancePanel
              mission={activeGuidanceMission}
              guidanceData={guidanceData}
              onRequestGuidance={handleRequestGuidance}
              onClose={() => {
                setActiveGuidanceMission(null);
                setGuidanceError(null);
              }}
              isLoading={isLoadingGuidance}
              error={guidanceError}
            />
          )}
        </div>
      ) : (
        <div className="glass-panel ui-border-border-a30 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full ui-bg-soft-a20 ui-text-ink flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold ui-text-ink">DSA starter completed!</h3>
          <p className="text-xs sm:text-sm ui-text-muted max-w-md mx-auto">
            {missions.length} missions across {Object.keys(activityByDay(goal, missions)).length} active days. Review your practice and reflections below. This records self-reported practice, not verified interview readiness.
          </p>
        </div>
      )}

      <PracticeActivity goal={goal} missions={missions} />

      {/* Full 12-Mission Curriculum Roadmap */}
      <details className="space-y-4 pt-4 border-t ui-border-border">
        <summary className="flex items-center justify-between cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-indigo-300">
          <h2 className="text-sm font-bold uppercase tracking-wider ui-text-ink flex items-center gap-2">
            <ListOrdered className="w-4 h-4 ui-text-ink" />
            <span>Your {missions.length}-mission roadmap</span>
          </h2>
          <span className="text-xs ui-text-muted">Expand to explore</span>
        </summary>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {missions.map((mission) => {
            const isCompleted = !!completions[mission.id];
            const isCurrent = mission.id === goal.nextMissionId;
            const completionData = completions[mission.id];
            const scheduledDate = scheduleMap[mission.id];

            return (
              <MissionCard
                key={mission.id}
                mission={mission}
                isCurrent={isCurrent}
                isCompleted={isCompleted}
                completionData={completionData}
                scheduledDate={scheduledDate}
                onComplete={isCurrent ? () => setActiveCompletingMission(mission) : null}
                onOpenGuidance={isCurrent ? () => setActiveGuidanceMission(mission) : null}
              />
            );
          })}
        </div>
      </details>

      {/* Completion Modal */}
      {activeCompletingMission && (
        <CompletionForm
          mission={activeCompletingMission}
          onSubmit={handleCompleteMission}
          onCancel={() => setActiveCompletingMission(null)}
          isSubmitting={isSubmittingCompletion}
        />
      )}
    </div>
  );
}
