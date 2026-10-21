import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Search,
  X,
  FileText,
  Clock
} from 'lucide-react';
import { filterNotesLibrary } from '../../services/workspace.js';
import RecallPanel from './RecallPanel.jsx';

export default function ReviewView({
  reviewItems = [],
  workspaceReviewQueue = [],
  notesLibrary = [],
  unresolvedCount = 0,
  onOpenPractice,
  onOpenProofLesson,
  onOpenPracticeProblem,
  onToggleSelfReportedStatus,
  onDismissResumeCard,
  onSelectView,
  isSaving,
  onSaveRecallAttempt,
  goal,
  onRefresh,
  onOpenPracticeProposal,
  onOpenPracticeSession,
  activePracticeSession
}) {
  const [activeRecallItem, setActiveRecallItem] = useState(null);
  const [recallDrafts, setRecallDrafts] = useState({});
  const [recallConfidences, setRecallConfidences] = useState({});
  const [recallAttemptIds, setRecallAttemptIds] = useState({});
  const [notesSearchQuery, setNotesSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    return filterNotesLibrary(notesLibrary, notesSearchQuery);
  }, [notesLibrary, notesSearchQuery]);

  return (
    <section id="view-review" role="region" aria-labelledby="review-heading" className="workspace-content review-view-container">
      {/* Review Header with Plain Student-Facing Copy */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 id="review-heading" className="text-xl font-bold ui-text-ink tracking-tight">Review</h2>
          <p className="text-sm ui-text-muted mt-1">
            Suggested from your saved notes, due recall dates, and completion history. These are practice suggestions, not a formal mastery test.
          </p>
        </div>
        {onOpenPracticeProposal && (
          <button
            type="button"
            onClick={activePracticeSession ? onOpenPracticeSession : onOpenPracticeProposal}
            className="secondary-button text-xs py-2 px-3 inline-flex items-center justify-center gap-1.5 ui-border-border ui-bg-soft ui-text-accent hover:ui-bg-surface transition-colors w-full sm:w-auto max-w-full text-center"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {activePracticeSession
                ? `Resume practice session (${(activePracticeSession.currentTaskIndex || 0) + 1}/${activePracticeSession.tasks?.length || 0})`
                : 'Practise what needs work (10–30 min)'}
            </span>
          </button>
        )}
      </div>

      {/* Active Recall Practice Panel with key to isolate state across missions */}
      {activeRecallItem && (
        <RecallPanel
          key={activeRecallItem.mission.id}
          mission={activeRecallItem.mission}
          item={activeRecallItem}
          goal={goal}
          recallDraft={recallDrafts[activeRecallItem.mission.id] || ''}
          onRecallDraftChange={(value) =>
            setRecallDrafts((drafts) => ({ ...drafts, [activeRecallItem.mission.id]: value }))
          }
          confidence={recallConfidences[activeRecallItem.mission.id] ?? null}
          onConfidenceChange={(conf) =>
            setRecallConfidences((confs) => ({ ...confs, [activeRecallItem.mission.id]: conf }))
          }
          attemptId={recallAttemptIds[activeRecallItem.mission.id] || null}
          onAttemptIdChange={(id) =>
            setRecallAttemptIds((ids) => ({ ...ids, [activeRecallItem.mission.id]: id }))
          }
          onSaveRecallAttempt={onSaveRecallAttempt}
          onRefresh={onRefresh}
          onClose={() => {
            setActiveRecallItem(null);
          }}
          onOpenPractice={onOpenPractice}
        />
      )}

      {/* SECTION 1: Review Queue */}
      <section className="space-y-4" aria-label="Review queue">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-base font-bold ui-text-ink flex items-center gap-2">
            <RotateCcw size={16} className="ui-text-accent" aria-hidden="true" />
            <span>Review queue ({reviewItems.length})</span>
          </h3>
          {unresolvedCount > 0 && (
            <span className="status-badge status-attention text-xs">
              {unresolvedCount} unresolved difficulty noted
            </span>
          )}
        </div>

        {/* Empty State for Review Queue */}
        {reviewItems.length === 0 ? (
          <div className="workspace-empty-state">
            <h3>No review items queued</h3>
            <p>
              When you record difficulties in practice, have recall reviews due, or complete missions with hints, items appear here.
            </p>
            <div className="workspace-empty-state-actions">
              <button
                type="button"
                onClick={() => onSelectView('today')}
                className="primary-button text-xs"
              >
                <Calendar size={14} aria-hidden="true" />
                <span>Return to Today</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectView('roadmap')}
                className="secondary-button text-xs"
              >
                <span>Explore Roadmap</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label="Review queue items">
            {reviewItems.map((item) => {
              const isBlocker = item.type === 'blocker';
              const isDismissed = Boolean(item.dismissed);
              const isUnresolved = !isDismissed && item.selfReportedStatus !== 'ready_to_continue';
              const isRecallDue = item.type === 'recall_due' || item.isRecallDue;

              return (
                <article
                  key={item.id}
                  role="listitem"
                  className="review-card"
                  aria-label={`Review item for ${item.mission?.title || item.missionId}`}
                >
                  {/* Card Top */}
                  <div className="review-card-top">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                        {item.missionId.toUpperCase()}
                      </span>
                      <h4 className="review-card-title">{item.mission?.title || item.missionId}</h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isDismissed ? (
                        <span className="status-badge status-neutral text-xs">
                          Dismissed note
                        </span>
                      ) : isRecallDue ? (
                        <span className="status-badge status-accent text-xs">
                          <RotateCcw size={12} className="inline mr-1" aria-hidden="true" />
                          <span>Recall due{item.nextReviewDate ? ` (${item.nextReviewDate})` : ''}</span>
                        </span>
                      ) : isBlocker ? (
                        <span
                          className={`status-badge text-xs ${
                            isUnresolved ? 'status-attention' : 'status-success'
                          }`}
                        >
                          {isUnresolved ? (
                            <>
                              <AlertCircle size={13} aria-hidden="true" />
                              <span>Needs review</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} aria-hidden="true" />
                              <span>Ready to continue</span>
                            </>
                          )}
                        </span>
                      ) : item.type === 'hint_review' ? (
                        <span className="status-badge status-accent text-xs">
                          <RotateCcw size={13} aria-hidden="true" />
                          <span>With hint</span>
                        </span>
                      ) : (
                        <span className="status-badge status-neutral text-xs">
                          <RotateCcw size={12} className="inline mr-1" aria-hidden="true" />
                          <span>Recall suggestion (3+ days)</span>
                        </span>
                      )}

                      {item.isCompleted && (
                        <span className="status-badge status-neutral text-xs">
                          Completed
                        </span>
                      )}

                      {item.recallHistory?.length > 0 && (
                        <span className="text-xs font-medium ui-text-muted">
                          {item.recallHistory.length} review{item.recallHistory.length === 1 ? '' : 's'} saved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Explicit reason why item is in review */}
                  <p className="text-xs font-semibold ui-text-accent">
                    {item.reason}
                  </p>

                  {/* Blocker Content */}
                  {isBlocker && (
                    <dl className="review-field-group">
                      {item.whereStuck && (
                        <div>
                          <dt>Where you got stuck</dt>
                          <dd>{item.whereStuck}</dd>
                        </div>
                      )}

                      {item.whatTried && (
                        <div>
                          <dt>What you tried</dt>
                          <dd>{item.whatTried}</dd>
                        </div>
                      )}

                      {item.assessment && (
                        <div>
                          <dt>Feedback on reasoning check</dt>
                          <dd>
                            <strong className="block mb-1">
                              Status: {item.assessment.status === 'on_track' ? 'On track' : 'Review suggested'}
                            </strong>
                            {item.assessment.explanation}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {/* Non-blocker Content: Reflection is revealed only in RecallPanel */}
                  {!isBlocker && (
                    <p className="text-xs ui-text-muted">
                      Suggested for spaced recall practice. Use the Recall action below to test your memory of the core solution and edge cases before checking your saved notes.
                    </p>
                  )}

                  {/* Actions */}
                  <div className="review-card-actions">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Recall Action button */}
                      <button
                        type="button"
                        onClick={() => setActiveRecallItem(item)}
                        className="primary-button text-xs py-2 px-3 min-h-[38px]"
                      >
                        <RotateCcw size={14} aria-hidden="true" />
                        <span>Recall</span>
                      </button>

                      {/* Working Open Practice Action */}
                      <button
                        type="button"
                        onClick={() => onOpenPractice(item.mission)}
                        className="secondary-button text-xs py-2 px-3 min-h-[38px]"
                      >
                        <BookOpen size={14} aria-hidden="true" />
                        <span>Open practice</span>
                      </button>

                      {isBlocker && !isDismissed && onToggleSelfReportedStatus && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onToggleSelfReportedStatus(item.missionId, item.selfReportedStatus)}
                          className="secondary-button text-xs py-2 px-3 min-h-[38px]"
                        >
                          {item.selfReportedStatus === 'ready_to_continue'
                            ? 'Mark still unsure'
                            : 'Mark ready to continue'}
                        </button>
                      )}
                    </div>

                    {isBlocker && !isDismissed && onDismissResumeCard && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => onDismissResumeCard(item.missionId)}
                        className="text-xs ui-text-muted hover:ui-text-ink underline text-button"
                      >
                        Dismiss from queue
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 1B: Curriculum Proof & Practice Review */}
      <section className="space-y-4 pt-6 border-t ui-border-border" aria-label="Workspace curriculum review queue">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-bold ui-text-ink flex items-center gap-2">
              <RotateCcw size={16} className="ui-text-accent" aria-hidden="true" />
              <span>Curriculum Proof &amp; Practice review ({workspaceReviewQueue.length})</span>
            </h3>
            <p className="text-xs ui-text-muted mt-0.5">
              Interactive trace exercises and external practice problems due for spaced review or flagged with misconceptions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectView('proof')}
              className="secondary-button text-xs py-1.5 px-2.5"
            >
              <span>Open Proof Studio</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('practice')}
              className="secondary-button text-xs py-1.5 px-2.5"
            >
              <span>Practice Library</span>
            </button>
          </div>
        </div>

        {workspaceReviewQueue.length === 0 ? (
          <div className="rounded-xl border ui-border-border ui-bg-surface p-5 text-center">
            <p className="text-xs ui-text-muted">
              No curriculum Proof exercises or Practice problems are currently flagged for review.
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Curriculum review items">
            {workspaceReviewQueue.map((wItem) => (
              <article
                key={wItem.id}
                role="listitem"
                className="rounded-xl border ui-border-border ui-bg-surface p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="status-badge status-accent text-xs">
                      {wItem.kind === 'exercise' ? 'Proof Exercise' : 'Practice Problem'}
                    </span>
                    <h4 className="text-sm font-bold ui-text-ink">{wItem.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {wItem.isDue && (
                      <span className="status-badge status-attention text-xs">
                        Due {wItem.nextReviewDate ? `(${wItem.nextReviewDate})` : ''}
                      </span>
                    )}
                    {wItem.attemptsCount > 0 && (
                      <span className="text-xs ui-text-muted">
                        {wItem.attemptsCount} attempt{wItem.attemptsCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold ui-text-accent">{wItem.reason}</p>

                {wItem.reflection && (
                  <p className="text-xs ui-text-muted italic">
                    Saved reflection: &ldquo;{wItem.reflection}&rdquo;
                  </p>
                )}
                {wItem.note && (
                  <p className="text-xs ui-text-muted italic">
                    Saved note: &ldquo;{wItem.note}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {wItem.kind === 'exercise' ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenProofLesson &&
                        onOpenProofLesson({
                          topicId: wItem.topicId,
                          lessonId: wItem.lessonId,
                          exerciseId: wItem.exerciseId
                        })
                      }
                      className="primary-button text-xs py-1.5 px-3"
                    >
                      <RotateCcw size={13} aria-hidden="true" />
                      <span>Re-trace in Proof Studio</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPracticeProblem && onOpenPracticeProblem(wItem.problemId)
                      }
                      className="primary-button text-xs py-1.5 px-3"
                    >
                      <BookOpen size={13} aria-hidden="true" />
                      <span>Review in Practice Library</span>
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: Searchable Notes Library */}
      <section className="space-y-4 pt-6 border-t ui-border-border" aria-label="Notes library">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-base font-bold ui-text-ink flex items-center gap-2">
              <FileText size={16} className="ui-text-accent" aria-hidden="true" />
              <span>Notes & reflections library ({notesLibrary.length})</span>
            </h3>
            <p className="text-xs ui-text-muted mt-0.5">
              Search all your saved practice notes, difficulties, completion reflections, and recall attempts.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="roadmap-search-icon" size={14} aria-hidden="true" />
            <input
              id="notes-search-input"
              type="search"
              value={notesSearchQuery}
              onChange={(e) => setNotesSearchQuery(e.target.value)}
              placeholder="Search notes and recall attempts..."
              className="roadmap-search-input text-xs py-1.5 pl-8 min-h-[36px]"
              aria-label="Search notes library"
            />
            {notesSearchQuery && (
              <button
                type="button"
                onClick={() => setNotesSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs ui-text-muted hover:ui-text-ink"
                aria-label="Clear notes search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <div className="rounded-xl border ui-border-border ui-bg-surface p-6 text-center">
            <p className="text-xs ui-text-muted">
              {notesSearchQuery
                ? `No saved notes match "${notesSearchQuery}".`
                : 'No practice notes saved yet. When you record notes or complete missions, your writings will be preserved here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Saved notes list">
            {filteredNotes.map((note) => {
              const canOpenPractice = note.isCurrent || note.isCompleted;

              return (
                <article
                  key={note.id}
                  role="listitem"
                  className="rounded-xl border ui-border-border ui-bg-surface p-4 space-y-3"
                  aria-label={`Notes for ${note.missionTitle}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wider ui-text-muted shrink-0">
                        {note.missionId.toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold ui-text-ink">{note.missionTitle}</h4>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="status-badge status-neutral text-xs">
                        {note.status === 'completed'
                          ? 'Completed'
                          : note.status === 'current'
                          ? 'Current mission'
                          : 'Upcoming'}
                      </span>

                      {canOpenPractice && (
                        <button
                          type="button"
                          onClick={() => setActiveRecallItem({
                            id: `notes-${note.missionId}`,
                            missionId: note.missionId,
                            mission: note.mission,
                            outcome: note.outcome,
                            reflection: note.reflection,
                            completedAt: note.completedAt,
                            isCompleted: note.status === 'completed',
                            isCurrent: note.status === 'current',
                            recallHistory: note.recallHistory,
                            latestRecall: note.latestRecall,
                            nextReviewDate: note.nextReviewDate
                          })}
                          className="secondary-button text-xs py-1 px-2.5 min-h-[30px]"
                          aria-label={`Recall practice for ${note.missionTitle}`}
                        >
                          <RotateCcw size={12} aria-hidden="true" />
                          <span>Recall</span>
                        </button>
                      )}

                      {canOpenPractice && (
                        <button
                          type="button"
                          onClick={() => onOpenPractice(note.mission)}
                          className="secondary-button text-xs py-1 px-2.5 min-h-[30px]"
                        >
                          <BookOpen size={12} aria-hidden="true" />
                          <span>Practice</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Where stuck / what tried */}
                  {(note.whereStuck || note.whatTried) && (
                    <div className="space-y-1.5 text-xs">
                      {note.whereStuck && (
                        <p className="ui-text-ink">
                          <strong className="ui-text-muted">Where stuck: </strong>
                          {note.whereStuck}
                        </p>
                      )}
                      {note.whatTried && (
                        <p className="ui-text-ink">
                          <strong className="ui-text-muted">What tried: </strong>
                          {note.whatTried}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Saved reflection */}
                  {note.reflection && (
                    <div className="rounded-lg ui-bg-soft p-2.5 border ui-border-border text-xs">
                      <span className="font-semibold ui-text-muted block mb-0.5">
                        Reflection ({note.outcome === 'independent' ? 'Independent' : 'With a hint'}):
                      </span>
                      <p className="italic ui-text-ink">&ldquo;{note.reflection}&rdquo;</p>
                    </div>
                  )}

                  {/* Saved recall history summary in Notes Library */}
                  {note.recallHistory?.length > 0 && (
                    <div className="flex items-center justify-between gap-2 pt-2 border-t ui-border-border text-xs flex-wrap">
                      <div className="flex items-center gap-1.5 ui-text-muted">
                        <Clock size={12} aria-hidden="true" />
                        <span>
                          {note.recallHistory.length} recall attempt{note.recallHistory.length === 1 ? '' : 's'} saved
                        </span>
                      </div>
                      {note.nextReviewDate && (
                        <span className="font-semibold ui-text-accent">
                          Next review scheduled: {note.nextReviewDate}
                        </span>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
