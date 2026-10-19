import React from 'react';
import ProgressSummary from '../ProgressSummary.jsx';
import PracticeActivity from '../PracticeActivity.jsx';
import MissionCard from '../MissionCard.jsx';
import ResumePracticeCard from '../ResumePracticeCard.jsx';
import FocusSessionCard from './FocusSessionCard.jsx';
import { readableDay } from '../../services/activity.js';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Compass,
  Calendar
} from 'lucide-react';
import { deriveActiveStudyPlanSession } from '../../services/workspace.js';

export default function TodayView({
  goal,
  catalog,
  missions,
  currentMission,
  scheduleMap,
  resumeContext,
  upcomingMissions = [],
  unresolvedReviewCount = 0,
  totalReviewCount = 0,
  activeDaysCount = 0,
  practiceLabel = 'Start practising',
  onOpenPractice,
  onStartComplete,
  onDismissResumeCard,
  onToggleSelfReportedStatus,
  isSavingLearningContext,
  onSelectView,
  editingName,
  setEditingName,
  draftName,
  setDraftName,
  saveName,
  savingName,
  onNavigateRecovery,
  onRefresh,
  isRefreshing,
  savedNotice,
  workspaceRecommendation,
  onOpenProofLesson,
  onOpenPracticeProblem,
  onOpenCheckpoint,
  onOpenContinuationPlan,
  // Focus Timer props
  timerState,
  remainingSeconds,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onSelectTimerPreset
}) {
  const planState = deriveActiveStudyPlanSession(goal?.studyWorkspace);
  const activeSession = planState.activeSession;
  const allPlanCompleted = planState.allCompleted;

  return (
    <section id="view-today" role="region" aria-labelledby="today-heading" className="workspace-content">
      {/* Optional Rename Form */}
      {editingName && (
        <form onSubmit={saveName} className="rounded-xl border ui-border-border ui-bg-surface p-4 space-y-3">
          <label htmlFor="rename-goal" className="block text-sm ui-text-ink font-semibold">Your goal name</label>
          <input
            id="rename-goal"
            required
            maxLength={80}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            className="w-full rounded-lg ui-bg-surface border ui-border-border p-3 ui-text-ink"
          />
          <p className="text-xs ui-text-muted">Naming your goal does not change the DSA Foundations curriculum.</p>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={savingName || !draftName.trim()}
              className="px-4 py-2 ui-bg-accent ui-text-inverse rounded-lg disabled:opacity-50 text-sm font-semibold"
            >
              {savingName ? 'Saving...' : 'Save goal name'}
            </button>
            <button
              type="button"
              disabled={savingName}
              onClick={() => setEditingName(false)}
              className="px-3 py-2 ui-text-ink text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Goal Header */}
      <div className="goal-heading">
        <div>
          <h1 id="today-heading" className="text-xl sm:text-2xl font-extrabold ui-text-ink tracking-tight">
            {goal?.goalName || 'Build my DSA foundations'}
          </h1>
          <p className="text-sm ui-text-muted mt-1">
            DSA Foundations · A manageable next step, at your pace.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              setDraftName(goal?.goalName || 'Build my DSA foundations');
              setEditingName(true);
            }}
            className="px-3 py-1.5 text-xs ui-text-ink rounded-xl border ui-border-border font-medium hover:ui-bg-soft"
          >
            Name my goal
          </button>

          {goal?.status !== 'completed' && onNavigateRecovery && (
            <button
              type="button"
              onClick={onNavigateRecovery}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ui-bg-surface hover:ui-bg-soft border ui-border-border text-xs font-semibold ui-text-ink transition-colors hover:ui-border-border-a40"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 ui-text-ink" />
              <span>Adjust my week</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl ui-bg-surface hover:ui-bg-soft border ui-border-border ui-text-ink hover:ui-text-ink transition-colors disabled:opacity-50"
            title="Refresh saved goal"
            aria-label="Refresh saved goal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {savedNotice && (
        <p role="status" className="saved-notice status-success">
          {savedNotice}
        </p>
      )}

      {/* Compact progress strip */}
      <ProgressSummary goal={goal} totalMissions={missions.length} />

      {/* Two-column layout: Current mission + Context rail */}
      <div className="today-grid">
        <div className="today-main">
          {currentMission ? (
            <MissionCard
              mission={currentMission}
              isCurrent
              scheduledDate={scheduleMap[currentMission.id]}
              onComplete={() => onStartComplete(currentMission)}
              onOpenGuidance={() => onOpenPractice(currentMission)}
              practiceLabel={practiceLabel}
              savedContextContent={
                resumeContext && (
                  <ResumePracticeCard
                    resumeContext={resumeContext}
                    onResume={() => onOpenPractice(resumeContext.mission)}
                    onDismiss={onDismissResumeCard}
                    onToggleStatus={onToggleSelfReportedStatus}
                    isSaving={isSavingLearningContext}
                  />
                )
              }
            />
          ) : (
            <div className="space-y-4">
              <section className="p-6 rounded-2xl border ui-border-border ui-bg-surface space-y-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Starter Track Completed
                      </span>
                      <span className="text-xs ui-text-muted">12 of 12 Missions</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold ui-text-ink tracking-tight">
                      DSA Starter Completed!
                    </h2>
                    <p className="text-xs sm:text-sm ui-text-muted leading-relaxed">
                      You completed all twelve starter missions across {activeDaysCount} active days. Your self-reported practice and reflections are preserved without claiming placement readiness.
                    </p>
                  </div>
                </div>

                {/* Evidence Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl border ui-border-border ui-bg-soft/40 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold ui-text-muted">Total Missions</span>
                    <p className="text-base font-extrabold ui-text-ink">{missions.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold ui-text-muted">Independent</span>
                    <p className="text-base font-extrabold ui-text-ink">
                      {Object.values(goal?.completions || {}).filter((c) => c.outcome === 'independent').length}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold ui-text-muted">With Hints</span>
                    <p className="text-base font-extrabold ui-text-ink">
                      {Object.values(goal?.completions || {}).filter((c) => c.outcome === 'with_hint').length}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold ui-text-muted">Saved Notes</span>
                    <p className="text-base font-extrabold ui-text-ink">
                      {Object.values(goal?.completions || {}).filter((c) => c.reflection?.trim()).length}
                    </p>
                  </div>
                </div>

                {/* Checkpoint Status Banner if completed */}
                {goal?.studyWorkspace?.continuation?.checkpoint?.latestAttempt && (
                  <div className="p-4 rounded-xl border ui-border-border ui-bg-soft/30 flex items-center justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold ui-text-ink">Foundations Checkpoint:</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {goal.studyWorkspace.continuation.checkpoint.latestAttempt.score.correct} /{' '}
                          {goal.studyWorkspace.continuation.checkpoint.latestAttempt.score.total} Correct
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full ui-bg-soft ui-text-muted uppercase font-semibold">
                          {goal.studyWorkspace.continuation.checkpoint.latestAttempt.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs ui-text-muted">Authoritative server evaluation recorded.</p>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenCheckpoint}
                      className="text-xs font-semibold ui-text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Review Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Dominant Continuation Actions */}
                <div className="pt-2 border-t ui-border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onOpenCheckpoint}
                    className="primary-button text-xs py-2.5 px-4 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {goal?.studyWorkspace?.continuation?.checkpoint?.latestAttempt
                        ? 'Review Foundations Checkpoint'
                        : 'Check My Foundations (10 min)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onOpenContinuationPlan}
                    className="px-4 py-2.5 rounded-xl border ui-border-border ui-bg-surface hover:ui-bg-soft text-xs font-semibold ui-text-ink flex items-center justify-center gap-2 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Choose My Next Step</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectView('atlas')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold ui-text-muted hover:ui-text-ink hover:ui-bg-soft flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Atlas</span>
                  </button>
                </div>
              </section>

              {/* Active Next-Week Plan Banner if accepted */}
              {goal?.studyWorkspace?.studyPlan && (
                <section className="p-5 rounded-2xl border ui-border-border ui-bg-surface space-y-3" aria-label="Active next-week plan">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold ui-text-ink uppercase tracking-wider">
                        Active Next-Week Plan
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onOpenContinuationPlan}
                      className="text-xs font-semibold ui-text-accent hover:underline flex items-center gap-1"
                    >
                      <span>Adjust schedule</span>
                    </button>
                  </div>

                  {allPlanCompleted ? (
                    <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20 text-xs text-emerald-800 dark:text-emerald-200 space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>All Scheduled Sessions Completed!</span>
                      </div>
                      <p className="text-xs opacity-90">
                        You have completed all {planState.totalSessions} scheduled study sessions. Ready to plan your next progression?
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={onOpenContinuationPlan}
                          className="primary-button text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Plan Next Sessions</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectView('atlas')}
                          className="secondary-button text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Explore Atlas</span>
                        </button>
                      </div>
                    </div>
                  ) : activeSession ? (
                    <div className="p-3.5 rounded-xl border ui-border-border ui-bg-soft/40 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Planned Next Step
                          </span>
                          {activeSession.isRevisit && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              Intentional Review
                            </span>
                          )}
                          {activeSession.totalParts > 1 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold ui-bg-soft ui-text-muted">
                              Part {activeSession.partIndex}/{activeSession.totalParts}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold ui-text-ink truncate">
                          {activeSession.title}
                        </p>
                        <p className="text-xs ui-text-muted">
                          Allocated: {activeSession.allocatedMinutes} mins · Scheduled for {activeSession.date}
                          {planState.totalSessions > 1 && (
                            <span className="ml-1 opacity-80">
                              (Session {planState.activeSessionIndex + 1} of {planState.totalSessions})
                            </span>
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const s = activeSession;
                          if (s.itemType === 'exercise' || s.itemType === 'lesson') {
                            if (onOpenProofLesson) {
                              onOpenProofLesson({
                                topicId: s.topicId,
                                lessonId: s.itemId.startsWith('les_') ? s.itemId : undefined,
                                exerciseId: s.itemId.startsWith('ex_') ? s.itemId : undefined
                              });
                            }
                          } else if (onOpenPracticeProblem) {
                            onOpenPracticeProblem(s.itemId);
                          }
                        }}
                        className="primary-button text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0"
                      >
                        <span>Start</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : null}
                </section>
              )}

              {/* Preserved ResumePracticeCard if student had an in-progress mission */}
              {resumeContext && (
                <ResumePracticeCard
                  resumeContext={resumeContext}
                  onResume={() => onOpenPractice(resumeContext.mission)}
                  onDismiss={onDismissResumeCard}
                  onToggleStatus={onToggleSelfReportedStatus}
                  isSaving={isSavingLearningContext}
                />
              )}
            </div>
          )}
        </div>

        {/* Context Rail */}
        <aside className="today-context-rail" aria-label="Today context and queue">
          {/* Focus Session Timer Card */}
          <FocusSessionCard
            timerState={timerState}
            remainingSeconds={remainingSeconds}
            onStart={onStartTimer}
            onPause={onPauseTimer}
            onResume={onResumeTimer}
            onReset={onResetTimer}
            onSelectPreset={onSelectTimerPreset}
          />

          {/* Atlas & Proof Curriculum Recommendation Card */}
          {workspaceRecommendation && (
            <div className="context-card" aria-label="Atlas and Proof recommended next step">
              <div className="context-card-header">
                <span className="context-card-title">
                  <Sparkles size={16} aria-hidden="true" />
                  <span>Atlas &amp; Proof next step</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectView('atlas')}
                  className="text-xs font-semibold ui-text-accent hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Atlas</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-2.5">
                <p className="text-sm font-bold ui-text-ink">
                  {workspaceRecommendation.title}
                </p>
                <p className="text-xs ui-text-muted leading-relaxed">
                  {workspaceRecommendation.reason}
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {workspaceRecommendation.lessonId ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenProofLesson &&
                        onOpenProofLesson({
                          topicId: workspaceRecommendation.topicId,
                          lessonId: workspaceRecommendation.lessonId,
                          exerciseId: workspaceRecommendation.exerciseId
                        })
                      }
                      className="primary-button text-xs py-1.5 px-3"
                    >
                      <span>Open in Proof Studio</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  ) : workspaceRecommendation.problemId ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPracticeProblem &&
                        onOpenPracticeProblem(workspaceRecommendation.problemId)
                      }
                      className="primary-button text-xs py-1.5 px-3"
                    >
                      <span>Open Practice Library</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectView('atlas')}
                      className="primary-button text-xs py-1.5 px-3"
                    >
                      <Compass size={13} aria-hidden="true" />
                      <span>Explore Topic Atlas</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectView('practice')}
                    className="secondary-button text-xs py-1.5 px-3"
                  >
                    <span>Practice Library</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Missions Card */}
          <div className="context-card">
            <div className="context-card-header">
              <span className="context-card-title">
                <Clock size={16} aria-hidden="true" />
                <span>Upcoming schedule</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectView('roadmap')}
                className="text-xs font-semibold ui-text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Full roadmap</span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>

            {upcomingMissions.length > 0 ? (
              <ul className="context-list">
                {upcomingMissions.map((m) => (
                  <li key={m.id} className="context-list-item">
                    <div className="context-item-primary">
                      <span className="context-item-title">
                        {m.id.toUpperCase()} · {m.title}
                      </span>
                      <span className="context-item-meta">
                        {m.scheduledDate
                          ? `Scheduled for ${readableDay(m.scheduledDate, { weekday: 'short', month: 'short', day: 'numeric' })}`
                          : 'Not scheduled'}
                      </span>
                    </div>
                    <span className="status-badge status-neutral text-xs">{m.minutes || 30}m</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="context-notice">
                {goal?.status === 'completed'
                  ? 'All 12 missions in DSA Foundations completed.'
                  : 'No subsequent missions scheduled this week.'}
              </p>
            )}
          </div>

          {/* Review & Notes Card */}
          <div className="context-card">
            <div className="context-card-header">
              <span className="context-card-title">
                <RotateCcw size={16} aria-hidden="true" />
                <span>Practice notes & review</span>
              </span>
              {totalReviewCount > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectView('review')}
                  className="text-xs font-semibold ui-text-accent hover:underline inline-flex items-center gap-1"
                >
                  <span>Open queue</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              )}
            </div>

            {totalReviewCount > 0 ? (
              <div className="space-y-2">
                <p className="text-sm ui-text-ink">
                  <strong>{totalReviewCount}</strong> item{totalReviewCount === 1 ? '' : 's'} available to revisit based on your practice notes and completion history.
                  {unresolvedReviewCount > 0 && (
                    <span className="block text-xs ui-text-muted mt-1">
                      {unresolvedReviewCount} unresolved difficulty noted.
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => onSelectView('review')}
                  className="secondary-button text-xs w-full py-2"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Review notes & hints</span>
                </button>
              </div>
            ) : (
              <p className="context-notice">
                No active blockers. When you note difficulties during practice, ask for guidance, or complete problems with hints, they will appear here.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Practice Activity Calendar */}
      <div className="pt-4 border-t ui-border-border">
        <PracticeActivity goal={goal} missions={missions} />
      </div>
    </section>
  );
}
