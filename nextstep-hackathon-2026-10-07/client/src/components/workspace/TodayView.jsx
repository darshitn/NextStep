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
  ArrowRight
} from 'lucide-react';

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
  // Focus Timer props
  timerState,
  remainingSeconds,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onResetTimer,
  onSelectTimerPreset
}) {
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
            <section className="mission-card completed-track">
              <CheckCircle2 size={32} />
              <h2>DSA starter completed!</h2>
              <p>
                {missions.length} missions completed across {activeDaysCount} active days. Your reflections and practice history are preserved.
              </p>
              {resumeContext && (
                <ResumePracticeCard
                  resumeContext={resumeContext}
                  onResume={() => onOpenPractice(resumeContext.mission)}
                  onDismiss={onDismissResumeCard}
                  onToggleStatus={onToggleSelfReportedStatus}
                  isSaving={isSavingLearningContext}
                />
              )}
            </section>
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
