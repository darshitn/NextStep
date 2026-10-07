import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressSummary from '../components/ProgressSummary.jsx';
import PracticeActivity from '../components/PracticeActivity.jsx';
import { activityByDay } from '../services/activity.js';
import MissionCard from '../components/MissionCard.jsx';
import CompletionForm from '../components/CompletionForm.jsx';
import GuidancePanel from '../components/GuidancePanel.jsx';
import ResumePracticeCard from '../components/ResumePracticeCard.jsx';
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

  // Learning loop operations state
  const [isSavingLearningContext, setIsSavingLearningContext] = useState(false);
  const [isSubmittingLearningCheck, setIsSubmittingLearningCheck] = useState(false);
  const [learningError, setLearningError] = useState(null);

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
        setSavedNotice('Practice recorded. One more step forward.');
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
  const handleRequestGuidance = async ({ missionId, category, feedback, whatTried, whereStuck }) => {
    setIsLoadingGuidance(true);
    setGuidanceError(null);
    try {
      const res = await apiService.getGuidance({
        expectedVersion: goal.version,
        missionId,
        category,
        feedback: feedback || whereStuck || whatTried || '',
        whatTried,
        whereStuck
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

  // Save Blocker Context handler
  const handleSaveLearningContext = async (contextData) => {
    setIsSavingLearningContext(true);
    setLearningError(null);
    try {
      const payload = {
        expectedVersion: goal.version,
        missionId: contextData.missionId,
        category: contextData.category || 'too_difficult',
        whatTried: contextData.whatTried !== undefined ? (contextData.whatTried ? String(contextData.whatTried).slice(0, 280) : null) : null,
        whereStuck: contextData.whereStuck !== undefined ? (contextData.whereStuck ? String(contextData.whereStuck).slice(0, 280) : null) : null,
        selfReportedStatus: contextData.selfReportedStatus || 'still_unsure',
        dismissed: Boolean(contextData.dismissed)
      };

      if (contextData.guidance) {
        payload.guidance = {
          questionId: contextData.guidance.questionId || null,
          questionText: contextData.guidance.questionText || contextData.guidance.checkQuestion || undefined,
          checkQuestion: contextData.guidance.checkQuestion || contextData.guidance.questionText || undefined,
          mode: contextData.guidance.mode,
          explanation: contextData.guidance.explanation,
          steps: contextData.guidance.steps,
          source: contextData.guidance.source
        };
      }

      const res = await apiService.saveLearningContext(payload);
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        setSavedNotice('Practice notes saved. Persisted across reloads.');
        setTimeout(() => setSavedNotice(''), 4000);
      }
      return res?.data;
    } catch (err) {
      console.error('Save learning context error:', err);
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setError('Your practice plan was updated in another session. Refreshing latest state...');
        handleRefresh();
      } else {
        setLearningError(err.message || 'Failed to save blocker context.');
      }
      throw err;
    } finally {
      setIsSavingLearningContext(false);
    }
  };

  // Submit Understanding Check handler
  const handleSubmitLearningCheck = async ({ missionId, questionId, answer, selfReportedStatus }) => {
    setIsSubmittingLearningCheck(true);
    setLearningError(null);
    try {
      const res = await apiService.submitLearningCheck({
        expectedVersion: goal.version,
        missionId,
        questionId,
        answer,
        selfReportedStatus
      });
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
      }
      return res?.data;
    } catch (err) {
      console.error('Submit learning check error:', err);
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setError('Your practice plan was updated in another session. Refreshing latest state...');
        handleRefresh();
      } else {
        setLearningError(err.message || 'Failed to evaluate understanding check.');
      }
      throw err;
    } finally {
      setIsSubmittingLearningCheck(false);
    }
  };

  // Dismiss Resume Card (keeps data in DB, marks dismissed: true)
  const handleDismissResumeCard = async (missionId) => {
    try {
      const existing = goal?.learning?.[missionId] || {};
      await handleSaveLearningContext({
        missionId,
        category: existing.category || 'too_difficult',
        whatTried: existing.whatTried ?? null,
        whereStuck: existing.whereStuck ?? null,
        selfReportedStatus: existing.selfReportedStatus || 'still_unsure',
        dismissed: true,
        guidance: existing.guidance || null
      });
    } catch (err) {
      console.error('Dismiss resume card error:', err);
    }
  };

  // Toggle self-reported status
  const handleToggleSelfReportedStatus = async (missionId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ready_to_continue' ? 'still_unsure' : 'ready_to_continue';
      const existing = goal?.learning?.[missionId] || {};
      await handleSaveLearningContext({
        missionId,
        category: existing.category || 'too_difficult',
        whatTried: existing.whatTried ?? null,
        whereStuck: existing.whereStuck ?? null,
        selfReportedStatus: newStatus,
        dismissed: Boolean(existing.dismissed),
        guidance: existing.guidance || null
      });
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  // Derive saved learning context to resume
  const learningRecords = goal?.learning || {};

  const resumeContext = React.useMemo(() => {
    if (!goal || !catalog) return null;

    // 1. Prefer active mission's context if present and not dismissed
    const activeRec = goal.nextMissionId ? learningRecords[goal.nextMissionId] : null;
    if (activeRec && !activeRec.dismissed && (activeRec.whereStuck || activeRec.whatTried || activeRec.assessment)) {
      const activeMissionObj = (catalog?.missions || []).find(m => m.id === goal.nextMissionId);
      return {
        record: activeRec,
        mission: activeMissionObj,
        isActiveMission: true
      };
    }

    const otherMissionIds = Object.keys(learningRecords).filter(mId => mId !== goal.nextMissionId);

    // 2. Prioritize unresolved blockers on any uncompleted missions (so completed earlier records do not crowd out active difficulties)
    const unresolvedUncompleted = otherMissionIds.find(mId => {
      const rec = learningRecords[mId];
      const isCompleted = Boolean(goal.completions?.[mId]);
      return rec && !rec.dismissed && (rec.whereStuck || rec.whatTried || rec.assessment) &&
        !isCompleted && rec.selfReportedStatus !== 'ready_to_continue';
    });
    if (unresolvedUncompleted) {
      const missionObj = (catalog?.missions || []).find(m => m.id === unresolvedUncompleted);
      return {
        record: learningRecords[unresolvedUncompleted],
        mission: missionObj,
        isActiveMission: false
      };
    }

    // 3. Any other uncompleted mission's un-dismissed record
    const uncompletedOther = otherMissionIds.find(mId => {
      const rec = learningRecords[mId];
      const isCompleted = Boolean(goal.completions?.[mId]);
      return rec && !rec.dismissed && (rec.whereStuck || rec.whatTried || rec.assessment) && !isCompleted;
    });
    if (uncompletedOther) {
      const missionObj = (catalog?.missions || []).find(m => m.id === uncompletedOther);
      return {
        record: learningRecords[uncompletedOther],
        mission: missionObj,
        isActiveMission: false
      };
    }

    // 4. Finally, any other un-dismissed record (e.g. from an earlier completed mission)
    for (const mId of otherMissionIds) {
      const rec = learningRecords[mId];
      if (rec && !rec.dismissed && (rec.whereStuck || rec.whatTried || rec.assessment)) {
        const missionObj = (catalog?.missions || []).find(m => m.id === mId);
        return {
          record: rec,
          mission: missionObj,
          isActiveMission: false
        };
      }
    }
    return null;
  }, [learningRecords, goal?.nextMissionId, goal?.completions, catalog]);

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

      {savedNotice && <p role="status" className="rounded-xl border ui-border-border-a30 ui-bg-soft-a10 px-4 py-3 text-sm ui-text-ink">{savedNotice}</p>}

      {/* Main Row: Current mission on the left, progress summary on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Compact Resume Card, Current Mission, Practice Guidance */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Compact Resume Practice Card close to current mission */}
          {resumeContext && (
            <ResumePracticeCard
              resumeContext={resumeContext}
              onResume={() => {
                setActiveGuidanceMission(resumeContext.mission);
                if (guidanceData && guidanceData.missionId !== resumeContext.mission?.id) {
                  setGuidanceData(null);
                }
              }}
              onDismiss={handleDismissResumeCard}
              onToggleStatus={handleToggleSelfReportedStatus}
              onAdjustTime={() => navigate('/recovery')}
              isSaving={isSavingLearningContext}
            />
          )}

          {/* Active Mission Section */}
          {currentMission ? (
            <div className="space-y-3 current-mission-container">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider ui-text-ink flex items-center gap-1.5">
                  <Compass className="w-4 h-4 ui-text-ink" />
                  <span>Current mission</span>
                </h2>
              </div>

              <div className="current-mission-card">
                <MissionCard
                  mission={currentMission}
                  isCurrent={true}
                  isCompleted={false}
                  scheduledDate={scheduleMap[currentMission.id]}
                  onComplete={() => setActiveCompletingMission(currentMission)}
                  onOpenGuidance={() => {
                    setActiveGuidanceMission(currentMission);
                    if (guidanceData && guidanceData.missionId !== currentMission.id) {
                      setGuidanceData(null);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="glass-panel ui-border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full ui-bg-soft ui-text-ink flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold ui-text-ink">DSA starter completed!</h3>
              <p className="text-xs sm:text-sm ui-text-muted max-w-md mx-auto">
                {missions.length} missions completed across {Object.keys(activityByDay(goal, missions)).length} active days. Review your practice reflections and activity below.
              </p>
            </div>
          )}

          {/* AI Guidance Drawer / Panel in context with mission */}
          {activeGuidanceMission && (
            <div className="pt-2">
              <GuidancePanel
                mission={activeGuidanceMission}
                guidanceData={guidanceData}
                savedContext={goal?.learning?.[activeGuidanceMission.id] || null}
                onRequestGuidance={handleRequestGuidance}
                onSaveContext={handleSaveLearningContext}
                onSubmitCheck={handleSubmitLearningCheck}
                onClose={() => {
                  setActiveGuidanceMission(null);
                  setGuidanceError(null);
                  setLearningError(null);
                }}
                isLoading={isLoadingGuidance}
                isSavingContext={isSavingLearningContext}
                isSubmittingCheck={isSubmittingLearningCheck}
                error={guidanceError}
                assessmentError={learningError}
              />
            </div>
          )}
        </div>

        {/* Right Column: Progress Summary */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <ProgressSummary goal={goal} totalMissions={missions.length} />
        </div>
      </div>

      {/* Weekly Calendar & Practice Activity below main row */}
      <div className="pt-4 border-t ui-border-border">
        <PracticeActivity goal={goal} missions={missions} />
      </div>

      {/* Full 12-Mission Curriculum Roadmap */}
      <details className="space-y-4 pt-4 border-t ui-border-border">
        <summary className="flex items-center justify-between cursor-pointer rounded-lg py-1 focus-visible:outline focus-visible:outline-indigo-300">
          <h2 className="text-xs font-bold uppercase tracking-wider ui-text-ink flex items-center gap-2">
            <ListOrdered className="w-4 h-4 ui-text-ink" />
            <span>Curriculum roadmap ({missions.length} missions)</span>
          </h2>
          <span className="text-xs ui-text-muted">Expand roadmap</span>
        </summary>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
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
