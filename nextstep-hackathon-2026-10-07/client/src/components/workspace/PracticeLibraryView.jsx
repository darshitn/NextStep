import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ExternalLink,
  CheckCircle2,
  RotateCcw,
  BookOpen,
  Filter,
  X
} from 'lucide-react';
import { filterPracticeProblems } from '../../services/workspace.js';

function makeUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function PracticeLibraryView({
  goal,
  catalog,
  highlightedProblemId,
  onClearHighlightedProblem,
  onSavePracticeAttempt,
  onOpenProofLesson
}) {
  const curriculum = catalog?.curriculum || {};
  const topics = curriculum.topics || [];
  const lessons = curriculum.lessons || [];
  const problems = curriculum.practiceProblems || [];
  const practiceAttempts = goal?.studyWorkspace?.practiceAttempts || {};

  const [query, setQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [activeLoggingProblemId, setActiveLoggingProblemId] = useState(highlightedProblemId || null);
  const [outcome, setOutcome] = useState('solved_independently');
  const [note, setNote] = useState('');
  const [needsReview, setNeedsReview] = useState(false);
  const [attemptId, setAttemptId] = useState(() => makeUuid());
  const [isSaving, setIsSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (highlightedProblemId) {
      setActiveLoggingProblemId(highlightedProblemId);
      setAttemptId(makeUuid());
    }
  }, [highlightedProblemId]);

  const topicMap = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const lessonMap = useMemo(() => new Map(lessons.map((l) => [l.id, l])), [lessons]);

  const filteredProblems = useMemo(() => {
    return filterPracticeProblems(problems, {
      query,
      topicId: topicFilter,
      difficulty: difficultyFilter,
      statusFilter,
      practiceAttempts
    });
  }, [problems, query, topicFilter, difficultyFilter, statusFilter, practiceAttempts]);

  const solvedCount = useMemo(() => {
    return problems.filter((p) => {
      const list = practiceAttempts[p.id];
      return (
        Array.isArray(list) &&
        list.some((a) => a.outcome === 'solved_independently' || a.outcome === 'with_hint')
      );
    }).length;
  }, [problems, practiceAttempts]);

  const handleOpenLogForm = (problem) => {
    const existingList = practiceAttempts[problem.id] || [];
    const latest = existingList.length > 0 ? existingList[existingList.length - 1] : null;
    setActiveLoggingProblemId(problem.id);
    setOutcome(latest?.outcome || 'solved_independently');
    setNote(latest?.note || '');
    setNeedsReview(Boolean(latest?.needsReview));
    setAttemptId(makeUuid());
    setSaveNotice('');
    setSaveError('');
  };

  const handleSubmitAttempt = async (e, problemId) => {
    e.preventDefault();
    if (!onSavePracticeAttempt) return;
    setIsSaving(true);
    setSaveError('');
    setSaveNotice('');
    try {
      const res = await onSavePracticeAttempt({
        attemptId,
        problemId,
        outcome,
        note: note.trim() || null,
        needsReview
      });
      const due = res?.practiceAttempt?.nextReviewDate;
      setSaveNotice(
        `Self-reported attempt saved${due ? ` · Next review date: ${due}` : ''}.`
      );
      setAttemptId(makeUuid());
    } catch (err) {
      setSaveError(err.message || 'Could not save practice attempt.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      id="view-practice"
      role="region"
      aria-labelledby="practice-heading"
      className="workspace-content space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 id="practice-heading" className="text-xl font-bold ui-text-ink tracking-tight">
            External Practice Problem Library
          </h2>
          <p className="text-sm ui-text-muted mt-1">
            {problems.length} curated external problems linked to NextStep Proof invariants ({solvedCount} solved). Outcomes are self-reported.
          </p>
        </div>

        <span className="status-badge status-neutral text-xs">
          Self-Reported Verification · Direct Provider Links
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="roadmap-toolbar space-y-3">
        <div className="roadmap-search-row">
          <div className="roadmap-search-wrapper">
            <Search size={16} className="roadmap-search-icon" aria-hidden="true" />
            <input
              id="practice-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems by title, pattern, or edge case..."
              aria-label="Search practice problem library"
              className="roadmap-search-input"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="roadmap-search-clear"
                aria-label="Clear practice search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="practice-topic-filter" className="block text-xs font-semibold ui-text-muted mb-1">
              Topic Filter
            </label>
            <select
              id="practice-topic-filter"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full rounded-lg border ui-border-border ui-bg-soft px-3 py-2 text-xs font-medium ui-text-ink"
            >
              <option value="all">All Topics ({problems.length})</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.order}. {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="practice-difficulty-filter" className="block text-xs font-semibold ui-text-muted mb-1">
              Difficulty (Provider Verified)
            </label>
            <select
              id="practice-difficulty-filter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full rounded-lg border ui-border-border ui-bg-soft px-3 py-2 text-xs font-medium ui-text-ink"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label htmlFor="practice-status-filter" className="block text-xs font-semibold ui-text-muted mb-1">
              Self-Reported Status
            </label>
            <select
              id="practice-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border ui-border-border ui-bg-soft px-3 py-2 text-xs font-medium ui-text-ink"
            >
              <option value="all">All Problems</option>
              <option value="unattempted">Not Yet Logged</option>
              <option value="solved">Solved (Solo or Hint)</option>
              <option value="needs_review">Flagged for Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Problem List */}
      {filteredProblems.length === 0 ? (
        <div className="workspace-empty-state">
          <h3>No practice problems match your filters</h3>
          <p>Try clearing your search query or switching the topic and difficulty filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setTopicFilter('all');
              setDifficultyFilter('all');
              setStatusFilter('all');
            }}
            className="secondary-button text-xs"
          >
            <span>Reset practice filters</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Practice problem list">
          {filteredProblems.map((prob) => {
            const topic = topicMap.get(prob.topicId);
            const firstLesson = lessonMap.get(prob.lessonIds?.[0]);
            const history = practiceAttempts[prob.id] || [];
            const latest = history.length > 0 ? history[history.length - 1] : null;
            const isLogging = activeLoggingProblemId === prob.id;

            return (
              <article
                key={prob.id}
                role="listitem"
                className="rounded-xl border ui-border-border ui-bg-surface p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                        {topic?.title || prob.topicId}
                      </span>
                      <span className="status-badge status-neutral text-xs">
                        {prob.difficulty}
                      </span>
                      <span className="status-badge status-accent text-xs">
                        {prob.pattern}
                      </span>
                      <span className="text-xs ui-text-muted">{prob.estimatedMinutes}m est.</span>
                    </div>

                    <h3 className="text-base font-bold ui-text-ink">{prob.title}</h3>
                    <p className="text-xs ui-text-ink">
                      <strong>Why recommended:</strong> {prob.whyRecommended}
                    </p>
                    <p className="text-xs ui-text-muted">
                      <strong>Key edge case to test:</strong> {prob.keyEdgeCase}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {latest && (
                      <span
                        className={`status-badge text-xs ${
                          latest.needsReview ? 'status-attention' : 'status-success'
                        }`}
                      >
                        {latest.outcome.replace(/_/g, ' ')}
                        {latest.needsReview ? ' · Review' : ''}
                      </span>
                    )}

                    {firstLesson && (
                      <button
                        type="button"
                        onClick={() => onOpenProofLesson(firstLesson.topicId, firstLesson.id)}
                        className="secondary-button text-xs py-1.5 px-2.5"
                      >
                        <BookOpen size={13} aria-hidden="true" />
                        <span>Lesson</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        isLogging ? setActiveLoggingProblemId(null) : handleOpenLogForm(prob)
                      }
                      className="primary-button text-xs py-1.5 px-3"
                    >
                      <span>{isLogging ? 'Close Log' : latest ? 'Update Log' : 'Log Outcome'}</span>
                    </button>

                    <a
                      href={prob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button text-xs py-1.5 px-3 inline-flex items-center gap-1"
                    >
                      <span>Solve on {prob.provider}</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </div>
                </div>

                {latest?.note && !isLogging && (
                  <div className="rounded-lg border ui-border-border ui-bg-soft p-2.5 text-xs ui-text-ink">
                    <strong>Saved note:</strong> {latest.note}{' '}
                    <span className="ui-text-muted">
                      (Next review: {latest.nextReviewDate})
                    </span>
                  </div>
                )}

                {isLogging && (
                  <form
                    onSubmit={(e) => handleSubmitAttempt(e, prob.id)}
                    className="rounded-xl border ui-border-border ui-bg-soft p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="text-xs font-bold uppercase tracking-wider ui-text-ink">
                        Log Self-Reported Outcome for {prob.title}
                      </h4>
                      {highlightedProblemId === prob.id && onClearHighlightedProblem && (
                        <button
                          type="button"
                          onClick={onClearHighlightedProblem}
                          className="text-xs ui-text-muted hover:underline"
                        >
                          Clear focus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor={`prac-outcome-${prob.id}`}
                          className="block text-xs font-semibold ui-text-muted mb-1"
                        >
                          Outcome (Self-Reported)
                        </label>
                        <select
                          id={`prac-outcome-${prob.id}`}
                          value={outcome}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOutcome(val);
                            setNeedsReview(val !== 'solved_independently');
                            setAttemptId(makeUuid());
                          }}
                          className="w-full rounded-lg border ui-border-border ui-bg-surface px-3 py-2 text-xs font-medium ui-text-ink"
                        >
                          <option value="solved_independently">Solved Independently</option>
                          <option value="with_hint">Solved With Hint</option>
                          <option value="reviewed_editorial">Reviewed Editorial / Solution</option>
                          <option value="bookmarked">Bookmarked for Later</option>
                        </select>
                      </div>

                      <div className="flex items-end pb-1">
                        <label className="inline-flex items-center gap-2 text-xs font-semibold ui-text-ink cursor-pointer">
                          <input
                            type="checkbox"
                            checked={needsReview}
                            onChange={(e) => {
                              setNeedsReview(e.target.checked);
                              setAttemptId(makeUuid());
                            }}
                          />
                          <span>Queue in Review for spaced retry</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`prac-note-${prob.id}`}
                        className="block text-xs font-semibold ui-text-muted mb-1"
                      >
                        Invariant &amp; Edge-Case Note (Optional)
                      </label>
                      <textarea
                        id={`prac-note-${prob.id}`}
                        rows={2}
                        maxLength={500}
                        value={note}
                        onChange={(e) => {
                          setNote(e.target.value);
                          setAttemptId(makeUuid());
                        }}
                        placeholder="What invariant or boundary check made this problem click?"
                        className="w-full rounded-lg border ui-border-border ui-bg-surface p-2.5 text-xs ui-text-ink"
                      />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="primary-button text-xs py-2 px-4"
                      >
                        <CheckCircle2 size={14} aria-hidden="true" />
                        <span>{isSaving ? 'Saving...' : 'Save Practice Log'}</span>
                      </button>
                      {saveNotice && (
                        <span role="status" className="text-xs font-semibold ui-text-accent">
                          {saveNotice}
                        </span>
                      )}
                      {saveError && (
                        <span role="alert" className="text-xs font-semibold ui-text-ink">
                          {saveError}
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
