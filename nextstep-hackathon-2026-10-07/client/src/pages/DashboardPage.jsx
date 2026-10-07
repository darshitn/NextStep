import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressSummary from '../components/ProgressSummary.jsx';
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
      setGuidanceError(err.message || 'Failed to obtain AI practice guidance.');
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
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Practice Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Today's manageable mission and persistent placement preparation horizon.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => navigate('/recovery')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-slate-700/60 text-xs font-semibold text-slate-200 transition-all hover:border-brand-500/40"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-400" />
            <span>Recalibrate Schedule</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-slate-700/60 text-slate-300 hover:text-white transition-all disabled:opacity-50"
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

      {/* Active Mission Section */}
      {currentMission ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-400" />
              <span>Next Manageable Mission</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Version {goal.version}
            </span>
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
        <div className="glass-panel border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">All 12 Starter Missions Completed!</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Congratulations on completing the entire DSA Foundations starter module ({goal.xp} XP). You have built consistent practice momentum.
          </p>
        </div>
      )}

      {/* Full 12-Mission Curriculum Roadmap */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-indigo-400" />
            <span>Full 12-Mission Curriculum</span>
          </h2>
          <span className="text-xs text-slate-500">Curated practice sequence</span>
        </div>

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
      </div>

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
