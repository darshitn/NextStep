import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import '../workspace.css';

import WorkspaceNav from '../components/workspace/WorkspaceNav.jsx';
import TodayView from '../components/workspace/TodayView.jsx';
import AtlasView from '../components/workspace/AtlasView.jsx';
import ProofStudio from '../components/workspace/ProofStudio.jsx';
import PracticeLibraryView from '../components/workspace/PracticeLibraryView.jsx';
import RoadmapView from '../components/workspace/RoadmapView.jsx';
import ReviewView from '../components/workspace/ReviewView.jsx';
import InsightsView from '../components/workspace/InsightsView.jsx';

import CompletionForm from '../components/CompletionForm.jsx';
import GuidancePanel from '../components/GuidancePanel.jsx';
import FoundationsCheckpointModal from '../components/workspace/FoundationsCheckpointModal.jsx';
import ContinuationPlanModal from '../components/workspace/ContinuationPlanModal.jsx';
import LoadingState from '../components/LoadingState.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { apiService } from '../services/apiService.js';
import {
  deriveWorkspaceStats,
  deriveReviewItems,
  deriveUpcomingMissions,
  deriveNotesLibrary,
  deriveWorkspaceReviewQueue,
  deriveExplainableRecommendation,
  calculateRemainingSeconds,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer
} from '../services/workspace.js';

export default function DashboardPage({
  goal,
  onGoalUpdated,
  catalog,
  onCatalogLoaded,
  initialView = null
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(!goal || !catalog);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [savedNotice, setSavedNotice] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Selected Atlas / Proof / Practice context
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [highlightedProblemId, setHighlightedProblemId] = useState(null);

  // Checkpoint & Continuation modals
  const [isCheckpointOpen, setIsCheckpointOpen] = useState(false);
  const [isContinuationPlanOpen, setIsContinuationPlanOpen] = useState(false);

  // Active view from URL search param or direct route
  const rawView = searchParams.get('view') || initialView || 'today';
  const validViews = ['today', 'atlas', 'proof', 'practice', 'roadmap', 'review', 'insights'];
  const activeView = validViews.includes(rawView) ? rawView : 'today';

  const handleSelectView = (viewId) => {
    if (location.pathname !== '/dashboard') {
      if (viewId === 'today') {
        navigate('/dashboard');
      } else {
        navigate(`/dashboard?view=${viewId}`);
      }
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (viewId === 'today') {
        next.delete('view');
      } else {
        next.set('view', viewId);
      }
      return next;
    });
  };

  // Focus Timer state (kept mounted at Dashboard level across view switches)
  const [timerState, setTimerState] = useState(() => resetTimer(25));
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);

  useEffect(() => {
    if (!timerState.isRunning || !timerState.endTime) return;

    const tick = () => {
      const remaining = calculateRemainingSeconds(timerState.endTime, Date.now());
      setRemainingSeconds(remaining);
      if (remaining <= 0) {
        setTimerState((prev) => ({
          ...prev,
          isRunning: false,
          endTime: null,
          pausedRemainingSeconds: 0,
          isCompleted: true
        }));
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [timerState.isRunning, timerState.endTime]);

  const handleStartTimer = () => {
    const next = startTimer({ durationMinutes: timerState.presetMinutes, now: Date.now() });
    setTimerState(next);
    setRemainingSeconds(next.totalSeconds);
  };

  const handlePauseTimer = () => {
    const next = pauseTimer(timerState, Date.now());
    setTimerState(next);
    setRemainingSeconds(next.pausedRemainingSeconds ?? 0);
  };

  const handleResumeTimer = () => {
    const next = resumeTimer(timerState, Date.now());
    setTimerState(next);
  };

  const handleResetTimer = () => {
    const next = resetTimer(timerState.presetMinutes);
    setTimerState(next);
    setRemainingSeconds(next.totalSeconds);
  };

  const handleSelectTimerPreset = (mins) => {
    const next = resetTimer(mins);
    setTimerState(next);
    setRemainingSeconds(next.totalSeconds);
  };

  const saveName = async (event) => {
    event.preventDefault();
    setSavingName(true);
    setError(null);
    try {
      const response = await apiService.renameGoal({
        goalName: draftName.trim(),
        expectedVersion: goal.version
      });
      onGoalUpdated(response.data.goal);
      setEditingName(false);
      setGuidanceData(null);
      setSavedNotice('Goal name saved. Your missions and progress are unchanged.');
    } catch (err) {
      setError(err.message || 'Could not save goal name.');
    } finally {
      setSavingName(false);
    }
  };

  // Active mission interactive modals/panels
  const [activeCompletingMission, setActiveCompletingMission] = useState(null);
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  const [activeGuidanceMission, setActiveGuidanceMission] = useState(null);
  const [practiceView, setPracticeView] = useState('today');
  const practiceRef = useRef(null);
  const practiceTriggerRef = useRef(null);

  const openPractice = (mission) => {
    if (!mission) return;
    setPracticeView(activeView);
    practiceTriggerRef.current = document.activeElement;
    const open = () => {
      setActiveGuidanceMission(mission);
      if (guidanceData && guidanceData.missionId !== mission.id) setGuidanceData(null);
      if (activeGuidanceMission?.id === mission.id) requestAnimationFrame(() => practiceRef.current?.focusHeading());
    };
    if (activeGuidanceMission && activeGuidanceMission.id !== mission.id) {
      practiceRef.current?.requestLeave(open);
    } else {
      open();
    }
  };

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
        if (!goal || !catalog) setIsLoading(true);
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
    return () => {
      mounted = false;
    };
  }, [goal, catalog, navigate, onGoalUpdated, onCatalogLoaded, loadAttempt]);

  // Refresh goal handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await apiService.getGoal();
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
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
        whatTried:
          contextData.whatTried !== undefined
            ? contextData.whatTried
              ? String(contextData.whatTried).slice(0, 280)
              : null
            : null,
        whereStuck:
          contextData.whereStuck !== undefined
            ? contextData.whereStuck
              ? String(contextData.whereStuck).slice(0, 280)
              : null
            : null,
        selfReportedStatus: contextData.selfReportedStatus || 'still_unsure',
        dismissed: Boolean(contextData.dismissed)
      };

      if (contextData.guidance) {
        payload.guidance = {
          questionId: contextData.guidance.questionId || null,
          questionText:
            contextData.guidance.questionText || contextData.guidance.checkQuestion || undefined,
          checkQuestion:
            contextData.guidance.checkQuestion || contextData.guidance.questionText || undefined,
          mode: contextData.guidance.mode,
          explanation: contextData.guidance.explanation,
          steps: contextData.guidance.steps,
          source: contextData.guidance.source
        };
      }

      const res = await apiService.saveLearningContext(payload);
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        setSavedNotice('Practice notes saved. You can return to them later.');
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

  // Save Recall Review handler
  const handleSaveRecallAttempt = async ({ missionId, attemptId, attemptText, confidence }) => {
    try {
      const res = await apiService.saveRecallAttempt({
        expectedVersion: goal.version,
        missionId,
        attemptId,
        attemptText,
        confidence
      });
      if (res?.data?.goal) {
        onGoalUpdated(res.data.goal);
        setSavedNotice('Recall review saved. Due date scheduled.');
        setTimeout(() => setSavedNotice(''), 4000);
      }
      return res?.data;
    } catch (err) {
      console.error('Save recall review error:', err);
      if (err.status === 409 || err.code === 'VERSION_CONFLICT') {
        setError('Your practice plan was updated in another session. Refreshing latest state...');
        handleRefresh();
      }
      throw err;
    }
  };

  // Dismiss Resume Card
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

  // Sync direct route params (/atlas/:topicSlug, /learn/:lessonId) into selection state
  useEffect(() => {
    if (!catalog?.curriculum) return;
    if (params.topicSlug) {
      const matchTopic = (catalog.curriculum.topics || []).find(
        (t) => t.slug === params.topicSlug || t.id === params.topicSlug
      );
      if (matchTopic) setSelectedTopicId(matchTopic.id);
    }
    if (params.lessonId) {
      const matchLesson = (catalog.curriculum.lessons || []).find((l) => l.id === params.lessonId);
      if (matchLesson) {
        setSelectedLessonId(matchLesson.id);
        setSelectedTopicId(matchLesson.topicId);
        if (matchLesson.exerciseId) {
          setSelectedExerciseId(matchLesson.exerciseId);
        } else {
          setSelectedExerciseId(null);
        }
      }
    }
  }, [params.topicSlug, params.lessonId, catalog]);

  // Workspace curriculum handlers (CAS versioned)
  const handleSaveLessonProgress = async (payload) => {
    const res = await apiService.saveLessonProgress({
      ...payload,
      expectedVersion: goal.version
    });
    if (res?.data?.goal) {
      onGoalUpdated(res.data.goal);
    }
    return res?.data;
  };

  const handleSaveExerciseAttempt = async (payload) => {
    const res = await apiService.saveExerciseAttempt({
      ...payload,
      expectedVersion: goal.version
    });
    if (res?.data?.goal) {
      onGoalUpdated(res.data.goal);
    }
    return res?.data;
  };

  const handleSavePracticeAttempt = async (payload) => {
    const res = await apiService.savePracticeAttempt({
      ...payload,
      expectedVersion: goal.version
    });
    if (res?.data?.goal) {
      onGoalUpdated(res.data.goal);
    }
    return res?.data;
  };

  const handlePreviewWorkspacePlan = async (payload) => {
    const res = await apiService.previewWorkspacePlan({
      ...payload,
      expectedVersion: goal.version
    });
    return res?.data;
  };

  const handleApplyWorkspacePlan = async (payload) => {
    const res = await apiService.applyWorkspacePlan({
      ...payload,
      expectedVersion: goal.version
    });
    if (res?.data?.goal) {
      onGoalUpdated(res.data.goal);
      setSavedNotice('Weekly study plan applied to your workspace.');
      setTimeout(() => setSavedNotice(''), 4000);
    }
    return res?.data;
  };

  const handleOpenProofLesson = ({ topicId, lessonId, exerciseId }) => {
    if (topicId) setSelectedTopicId(topicId);
    if (lessonId) setSelectedLessonId(lessonId);
    setSelectedExerciseId(exerciseId || null);
    handleSelectView('proof');
  };

  const handleOpenPracticeProblem = (problemId) => {
    if (problemId) setHighlightedProblemId(problemId);
    handleSelectView('practice');
  };

  // Derive saved learning context to resume on Today
  const learningRecords = goal?.learning || {};

  const resumeContext = useMemo(() => {
    if (!goal || !catalog) return null;

    const activeRec = goal.nextMissionId ? learningRecords[goal.nextMissionId] : null;
    if (activeRec && !activeRec.dismissed && (activeRec.whereStuck || activeRec.whatTried || activeRec.assessment)) {
      const activeMissionObj = (catalog?.missions || []).find((m) => m.id === goal.nextMissionId);
      return {
        record: activeRec,
        mission: activeMissionObj,
        isActiveMission: true
      };
    }

    const otherMissionIds = Object.keys(learningRecords).filter((mId) => mId !== goal.nextMissionId);

    const unresolvedUncompleted = otherMissionIds.find((mId) => {
      const rec = learningRecords[mId];
      const isCompleted = Boolean(goal.completions?.[mId]);
      return (
        rec &&
        !rec.dismissed &&
        (rec.whereStuck || rec.whatTried || rec.assessment) &&
        !isCompleted &&
        rec.selfReportedStatus !== 'ready_to_continue'
      );
    });
    if (unresolvedUncompleted) {
      const missionObj = (catalog?.missions || []).find((m) => m.id === unresolvedUncompleted);
      return {
        record: learningRecords[unresolvedUncompleted],
        mission: missionObj,
        isActiveMission: false
      };
    }

    const uncompletedOther = otherMissionIds.find((mId) => {
      const rec = learningRecords[mId];
      const isCompleted = Boolean(goal.completions?.[mId]);
      return rec && !rec.dismissed && (rec.whereStuck || rec.whatTried || rec.assessment) && !isCompleted;
    });
    if (uncompletedOther) {
      const missionObj = (catalog?.missions || []).find((m) => m.id === uncompletedOther);
      return {
        record: learningRecords[uncompletedOther],
        mission: missionObj,
        isActiveMission: false
      };
    }

    for (const mId of otherMissionIds) {
      const rec = learningRecords[mId];
      if (rec && !rec.dismissed && (rec.whereStuck || rec.whatTried || rec.assessment)) {
        const missionObj = (catalog?.missions || []).find((m) => m.id === mId);
        return {
          record: rec,
          mission: missionObj,
          isActiveMission: false
        };
      }
    }
    return null;
  }, [learningRecords, goal?.nextMissionId, goal?.completions, catalog]);

  // Derived workspace models
  const missions = catalog?.missions || [];
  const currentMission = missions.find((m) => m.id === goal?.nextMissionId);

  const scheduleMap = useMemo(() => {
    const map = {};
    (goal?.schedule || []).forEach((item) => {
      map[item.missionId] = item.date;
    });
    return map;
  }, [goal?.schedule]);

  const workspaceStats = useMemo(() => deriveWorkspaceStats(goal, catalog), [goal, catalog]);
  const reviewData = useMemo(() => deriveReviewItems(goal, catalog), [goal, catalog]);
  const upcomingMissions = useMemo(() => deriveUpcomingMissions(goal, catalog, 3), [goal, catalog]);
  const notesLibrary = useMemo(() => deriveNotesLibrary(goal, catalog), [goal, catalog]);
  const workspaceReviewQueue = useMemo(() => deriveWorkspaceReviewQueue(goal, catalog), [goal, catalog]);
  const workspaceRecommendation = useMemo(() => deriveExplainableRecommendation(goal, catalog), [goal, catalog]);

  if (!isLoading && error && (!goal || !catalog)) {
    return <ErrorNotice error={error} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />;
  }
  if (isLoading || !goal || !catalog) {
    return <LoadingState message="Loading your practice dashboard..." />;
  }

  // Regression compatibility practice label
  const practiceLabel =
    goal.learning?.[currentMission?.id] || activeGuidanceMission?.id === currentMission?.id
      ? 'Continue practising'
      : 'Start practising';

  return (
    <div className="workspace-container">
      {/* Main workspace layout with persistent navigation rail */}
      <div className="workspace-layout">
        <WorkspaceNav
          activeView={activeView}
          onSelectView={handleSelectView}
          unresolvedReviewCount={reviewData.unresolvedCount}
        />

        <div className="workspace-main-panel min-w-0 flex flex-col gap-6">
          {/* GuidancePanel renders outside per-view content so view switching preserves drafts */}
          {activeGuidanceMission && (
            <div hidden={practiceView !== activeView}>
            <GuidancePanel
              ref={practiceRef}
              mission={activeGuidanceMission}
              guidanceData={guidanceData}
              savedContext={goal.learning?.[activeGuidanceMission.id] || null}
              onRequestGuidance={handleRequestGuidance}
              onSaveContext={handleSaveLearningContext}
              onSubmitCheck={handleSubmitLearningCheck}
              onClose={() => {
                setActiveGuidanceMission(null);
                setGuidanceError(null);
                setLearningError(null);
                practiceTriggerRef.current?.focus({ preventScroll: true });
              }}
              isLoading={isLoadingGuidance}
              isSavingContext={isSavingLearningContext}
              isSubmittingCheck={isSubmittingLearningCheck}
              error={guidanceError}
              assessmentError={learningError}
            />
            </div>
          )}

          {error && (
            <ErrorNotice error={error} onDismiss={() => setError(null)} onRetry={handleRefresh} />
          )}

          {activeView === 'today' && (
            <TodayView
              goal={goal}
              catalog={catalog}
              missions={missions}
              currentMission={currentMission}
              scheduleMap={scheduleMap}
              resumeContext={resumeContext}
              upcomingMissions={upcomingMissions}
              unresolvedReviewCount={reviewData.unresolvedCount}
              totalReviewCount={reviewData.totalCount}
              activeDaysCount={workspaceStats.activeDaysCount}
              practiceLabel={practiceLabel}
              onOpenPractice={openPractice}
              onStartComplete={(m) => setActiveCompletingMission(m)}
              onDismissResumeCard={handleDismissResumeCard}
              onToggleSelfReportedStatus={handleToggleSelfReportedStatus}
              isSavingLearningContext={isSavingLearningContext}
              onSelectView={handleSelectView}
              editingName={editingName}
              setEditingName={setEditingName}
              draftName={draftName}
              setDraftName={setDraftName}
              saveName={saveName}
              savingName={savingName}
              onNavigateRecovery={() => navigate('/recovery')}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              savedNotice={savedNotice}
              workspaceRecommendation={workspaceRecommendation}
              onOpenProofLesson={handleOpenProofLesson}
              onOpenPracticeProblem={handleOpenPracticeProblem}
              onOpenCheckpoint={() => setIsCheckpointOpen(true)}
              onOpenContinuationPlan={() => setIsContinuationPlanOpen(true)}
              // Focus timer props
              timerState={timerState}
              remainingSeconds={remainingSeconds}
              onStartTimer={handleStartTimer}
              onPauseTimer={handlePauseTimer}
              onResumeTimer={handleResumeTimer}
              onResetTimer={handleResetTimer}
              onSelectTimerPreset={handleSelectTimerPreset}
            />
          )}

          {activeView === 'atlas' && (
            <AtlasView
              goal={goal}
              catalog={catalog}
              selectedTopicId={selectedTopicId}
              onSelectTopic={(tId) => setSelectedTopicId(tId)}
              onOpenProofLesson={handleOpenProofLesson}
              onOpenPracticeProblem={handleOpenPracticeProblem}
              onPreviewWorkspacePlan={handlePreviewWorkspacePlan}
              onApplyWorkspacePlan={handleApplyWorkspacePlan}
              onSelectView={handleSelectView}
            />
          )}

          {activeView === 'proof' && (
            <ProofStudio
              goal={goal}
              catalog={catalog}
              selectedTopicId={selectedTopicId}
              selectedLessonId={selectedLessonId}
              selectedExerciseId={selectedExerciseId}
              onSelectTopic={(tId) => setSelectedTopicId(tId)}
              onSelectLesson={(lId) => setSelectedLessonId(lId)}
              onSelectExercise={(eId) => setSelectedExerciseId(eId)}
              onSaveLessonProgress={handleSaveLessonProgress}
              onSaveExerciseAttempt={handleSaveExerciseAttempt}
              onOpenPracticeProblem={handleOpenPracticeProblem}
              onSelectView={handleSelectView}
            />
          )}

          {activeView === 'practice' && (
            <PracticeLibraryView
              goal={goal}
              catalog={catalog}
              highlightedProblemId={highlightedProblemId}
              onClearHighlightedProblem={() => setHighlightedProblemId(null)}
              onSavePracticeAttempt={handleSavePracticeAttempt}
              onOpenProofLesson={handleOpenProofLesson}
            />
          )}

          {activeView === 'roadmap' && (
            <RoadmapView
              catalog={catalog}
              missions={missions}
              goal={goal}
              scheduleMap={scheduleMap}
              onOpenPractice={openPractice}
              onStartComplete={(m) => setActiveCompletingMission(m)}
              activeGuidanceMission={activeGuidanceMission}
            />
          )}

          <div hidden={activeView !== 'review'}>
            <ReviewView
              reviewItems={reviewData.items}
              workspaceReviewQueue={workspaceReviewQueue}
              notesLibrary={notesLibrary}
              unresolvedCount={reviewData.unresolvedCount}
              onOpenPractice={openPractice}
              onOpenProofLesson={handleOpenProofLesson}
              onOpenPracticeProblem={handleOpenPracticeProblem}
              onToggleSelfReportedStatus={handleToggleSelfReportedStatus}
              onDismissResumeCard={handleDismissResumeCard}
              onSelectView={handleSelectView}
              isSaving={isSavingLearningContext}
              onSaveRecallAttempt={handleSaveRecallAttempt}
              goal={goal}
              onRefresh={handleRefresh}
            />
          </div>

          {activeView === 'insights' && (
            <InsightsView
              stats={workspaceStats}
              goal={goal}
              catalog={catalog}
            />
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {activeCompletingMission && (
        <CompletionForm
          mission={activeCompletingMission}
          onSubmit={handleCompleteMission}
          onCancel={() => setActiveCompletingMission(null)}
          isSubmitting={isSubmittingCompletion}
          submitError={error}
        />
      )}

      {/* Foundations Checkpoint Modal */}
      <FoundationsCheckpointModal
        isOpen={isCheckpointOpen}
        onClose={() => setIsCheckpointOpen(false)}
        goal={goal}
        onGoalUpdated={onGoalUpdated}
        onStartNextWeekPlan={() => {
          setIsCheckpointOpen(false);
          setIsContinuationPlanOpen(true);
        }}
        onOpenProofLesson={handleOpenProofLesson}
      />

      {/* Next-Week Continuation Plan Modal */}
      <ContinuationPlanModal
        isOpen={isContinuationPlanOpen}
        onClose={() => setIsContinuationPlanOpen(false)}
        goal={goal}
        catalog={catalog}
        onGoalUpdated={onGoalUpdated}
        onPlanAccepted={() => {
          setSavedNotice('Next-week study plan saved and active.');
        }}
      />
    </div>
  );
}
