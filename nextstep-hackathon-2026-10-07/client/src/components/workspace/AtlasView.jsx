import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Play,
  ArrowRight,
  Calendar,
  Sparkles,
  List,
  LayoutGrid,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';
import { deriveTopicAtlasModel, deriveExplainableRecommendation } from '../../services/workspace.js';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' }
];
const MINUTE_OPTIONS = [0, 30, 60, 90];

const STAGE_TITLES = {
  1: 'Linear Invariants & Pointers',
  2: 'Structured Associations & Stacks',
  3: 'Recursive Search & Trees',
  4: 'Optimization, Intervals & Graphs'
};

export default function AtlasView({
  goal,
  catalog,
  selectedTopicId,
  onSelectTopic,
  onOpenProofLesson,
  onOpenPracticeProblem,
  onPreviewWorkspacePlan,
  onApplyWorkspacePlan,
  onSelectView
}) {
  const atlas = useMemo(() => deriveTopicAtlasModel(goal, catalog), [goal, catalog]);
  const recommendation = useMemo(
    () => deriveExplainableRecommendation(goal, catalog),
    [goal, catalog]
  );

  const [displayMode, setDisplayMode] = useState('map'); // 'map' | 'list'
  const [showPlanner, setShowPlanner] = useState(false);
  const [planAvailability, setPlanAvailability] = useState(
    () =>
      goal?.studyWorkspace?.studyPlan?.availability ||
      goal?.availability || { mon: 30, tue: 30, wed: 30, thu: 30, fri: 30, sat: 0, sun: 0 }
  );
  const [selectedPlanItems, setSelectedPlanItems] = useState(() => {
    const existing = goal?.studyWorkspace?.studyPlan?.selectedItemIds;
    if (Array.isArray(existing) && existing.length > 0) return existing;
    const firstTopicLessons = (catalog?.curriculum?.lessons || [])
      .filter((l) => l.topicId === (selectedTopicId || 'topic_arrays'))
      .map((l) => l.id);
    return firstTopicLessons.length > 0 ? firstTopicLessons : ['les_arrays_01', 'les_arrays_02'];
  });
  const [planPreview, setPlanPreview] = useState(null);
  const [previewedSnapshot, setPreviewedSnapshot] = useState(null);
  const [isPreviewingPlan, setIsPreviewingPlan] = useState(false);
  const [isApplyingPlan, setIsApplyingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const [planNotice, setPlanNotice] = useState('');

  const activeTopic = useMemo(() => {
    return (
      atlas.topics.find((t) => t.id === selectedTopicId) ||
      atlas.topics[0] ||
      null
    );
  }, [atlas.topics, selectedTopicId]);

  const savedStudyPlan = goal?.studyWorkspace?.studyPlan || null;

  // Derive legacy starter track count
  const starterCompletedCount = useMemo(() => {
    const completions = goal?.completions || {};
    const missions = catalog?.missions || [];
    return Object.keys(completions).filter((id) => missions.some((m) => m.id === id)).length;
  }, [goal?.completions, catalog?.missions]);
  const totalStarterCount = (catalog?.missions || []).length || 12;

  // Group topics by lane for structured stages
  const groupedLanes = useMemo(() => {
    const lanesMap = new Map();
    for (const topic of atlas.topics) {
      const laneNum = topic.lane || 1;
      if (!lanesMap.has(laneNum)) lanesMap.set(laneNum, []);
      lanesMap.get(laneNum).push(topic);
    }
    return Array.from(lanesMap.entries()).sort(([a], [b]) => a - b);
  }, [atlas.topics]);

  const handleTogglePlanItem = (itemId) => {
    setPlanPreview(null);
    setPreviewedSnapshot(null);
    setSelectedPlanItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handlePreviewPlan = async () => {
    if (!onPreviewWorkspacePlan) return;
    if (selectedPlanItems.length === 0) {
      setPlanError('Select at least one lesson or practice item to schedule.');
      return;
    }
    setIsPreviewingPlan(true);
    setPlanError('');
    setPlanNotice('');
    try {
      const data = await onPreviewWorkspacePlan({
        availability: planAvailability,
        selectedItemIds: selectedPlanItems,
        targetDate: goal?.targetDate
      });
      setPlanPreview(data);
      setPreviewedSnapshot({
        availability: JSON.stringify(planAvailability),
        selectedItemIds: JSON.stringify(selectedPlanItems)
      });
    } catch (err) {
      setPlanError(err.message || 'Could not generate study plan preview.');
    } finally {
      setIsPreviewingPlan(false);
    }
  };

  const handleAcceptPlan = async () => {
    if (!planPreview || !onApplyWorkspacePlan) return;
    if (
      !previewedSnapshot ||
      previewedSnapshot.availability !== JSON.stringify(planAvailability) ||
      previewedSnapshot.selectedItemIds !== JSON.stringify(selectedPlanItems)
    ) {
      setPlanError('Planner inputs changed since last preview. Please generate a fresh preview before accepting.');
      return;
    }

    setIsApplyingPlan(true);
    setPlanError('');
    try {
      await onApplyWorkspacePlan({
        previewForDate: planPreview.previewForDate,
        curriculumVersion: planPreview.curriculumVersion,
        availability: planAvailability,
        selectedItemIds: selectedPlanItems,
        targetDate: goal?.targetDate
      });
      setPlanPreview(null);
      setPreviewedSnapshot(null);
      setPlanNotice('Study plan saved! Your sessions are now active in Today and Atlas.');
    } catch (err) {
      setPlanError(err.message || 'Could not apply study plan.');
    } finally {
      setIsApplyingPlan(false);
    }
  };

  return (
    <section
      id="view-atlas"
      role="region"
      aria-labelledby="atlas-heading"
      className="workspace-content space-y-6"
    >
      {/* Header & View Mode Toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 id="atlas-heading" data-guide="atlas-heading" className="text-xl font-bold ui-text-ink tracking-tight">
            Learning path &amp; Prerequisite Map
          </h2>
          <p className="text-sm ui-text-muted mt-1">
            {atlas.topics.length} structured DSA topics · {atlas.completedLessonsCount}/
            {atlas.totalLessonsCount} lessons completed · {atlas.completedExercisesCount}/
            {atlas.totalExercisesCount} Proof traces verified · {atlas.solvedPracticeCount}/
            {atlas.totalPracticeCount} practice problems logged.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            role="group"
            aria-label="Atlas display mode"
            className="inline-flex rounded-xl border ui-border-border ui-bg-surface p-1 gap-1"
          >
            <button
              type="button"
              onClick={() => setDisplayMode('map')}
              aria-pressed={displayMode === 'map'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                displayMode === 'map'
                  ? 'ui-bg-soft ui-text-ink border ui-border-accent'
                  : 'ui-text-muted'
              }`}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              <span>Topic Map</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('list')}
              aria-pressed={displayMode === 'list'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                displayMode === 'list'
                  ? 'ui-bg-soft ui-text-ink border ui-border-accent'
                  : 'ui-text-muted'
              }`}
            >
              <List size={14} aria-hidden="true" />
              <span>Accessible List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowPlanner((prev) => !prev)}
            className="secondary-button text-xs py-2 px-3.5"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>{showPlanner ? 'Hide Study Planner' : 'Plan Curriculum Sessions'}</span>
          </button>
        </div>
      </div>

      {/* Legacy Starter Track Callout (Separated Container) */}
      <div className="rounded-xl border ui-border-border ui-bg-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
              Legacy Starter Track
            </span>
            <span className="status-badge status-neutral text-xs">
              {starterCompletedCount}/{totalStarterCount} Missions Complete
            </span>
          </div>
          <p className="text-xs ui-text-muted">
            The foundational 12 missions remain fully preserved with scheduled dates, focus timer, and spaced recall.
          </p>
        </div>
        {onSelectView && (
          <button
            type="button"
            onClick={() => onSelectView('roadmap')}
            className="secondary-button text-xs py-1.5 px-3 self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5"
          >
            <span>View 12-Mission Roadmap</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Explainable Recommendation Banner (Clean Mobile Stacking) */}
      {recommendation && (
        <div
          className="rounded-xl border ui-border-border ui-bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          aria-label="Recommended next learning step"
        >
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="status-badge status-accent text-xs">
                <Sparkles size={12} aria-hidden="true" />
                <span>{recommendation.badge}</span>
              </span>
              <span className="text-xs font-semibold ui-text-muted">
                {recommendation.topicTitle} · {recommendation.estimatedMinutes}m
              </span>
            </div>
            <h3 className="text-base font-bold ui-text-ink break-words">{recommendation.title}</h3>
            <p className="text-xs ui-text-muted">
              <strong>Why recommended:</strong> {recommendation.reason}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenProofLesson(
                recommendation.topicId,
                recommendation.lessonId,
                recommendation.exerciseId
              )
            }
            className="primary-button text-xs py-2 px-4 w-full sm:w-auto shrink-0"
          >
            <Play size={14} aria-hidden="true" />
            <span>Open in Proof Studio</span>
          </button>
        </div>
      )}

      {/* Capacity-Aware Study Planner Panel */}
      {showPlanner && (
        <section
          aria-labelledby="atlas-planner-heading"
          className="rounded-xl border ui-border-border ui-bg-surface p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 id="atlas-planner-heading" className="text-base font-bold ui-text-ink">
                Capacity-Aware Curriculum Study Planner
              </h3>
              <p className="text-xs ui-text-muted mt-0.5">
                Preview how selected lessons and practice problems fit your weekly time blocks. Prerequisite lessons are automatically ordered first, completed lessons are skipped, and long items span multiple sessions without altering your 12-mission starter schedule.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!activeTopic) return;
                const topicLessonIds = activeTopic.lessons
                  .filter(
                    (l) => goal?.studyWorkspace?.lessonProgress?.[l.id]?.status !== 'completed'
                  )
                  .map((l) => l.id);
                setSelectedPlanItems(
                  topicLessonIds.length > 0
                    ? topicLessonIds
                    : activeTopic.lessons.map((l) => l.id)
                );
                setPlanPreview(null);
                setPreviewedSnapshot(null);
              }}
              className="secondary-button text-xs py-1.5 px-3"
            >
              <span>Select Active Topic Lessons</span>
            </button>
          </div>

          {/* Weekly Availability Selector */}
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider ui-text-muted">
              Daily Study Capacity (Minutes)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {DAYS.map((d) => (
                <div
                  key={d.key}
                  className="rounded-lg border ui-border-border ui-bg-soft p-2 flex flex-col gap-1"
                >
                  <label
                    htmlFor={`plan-day-${d.key}`}
                    className="text-xs font-bold ui-text-ink"
                  >
                    {d.label}
                  </label>
                  <select
                    id={`plan-day-${d.key}`}
                    value={planAvailability[d.key] || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPlanAvailability((prev) => ({ ...prev, [d.key]: val }));
                      setPlanPreview(null);
                      setPreviewedSnapshot(null);
                    }}
                    className="rounded border ui-border-border ui-bg-surface px-2 py-1 text-xs font-semibold ui-text-ink"
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}m
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Selectable Items Checkboxes */}
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider ui-text-muted">
              Lessons to Schedule ({selectedPlanItems.length} selected)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
              {(catalog?.curriculum?.lessons || []).map((les) => {
                const isDone =
                  goal?.studyWorkspace?.lessonProgress?.[les.id]?.status === 'completed';
                const checked = selectedPlanItems.includes(les.id);
                return (
                  <label
                    key={les.id}
                    className={`rounded-lg border p-2.5 text-xs flex items-start gap-2 cursor-pointer ${
                      checked
                        ? 'ui-border-accent ui-bg-soft font-semibold ui-text-ink'
                        : 'ui-border-border ui-bg-surface ui-text-ink'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTogglePlanItem(les.id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{les.title}</span>
                      <span className="ui-text-muted font-normal">
                        {les.estimatedMinutes}m {isDone ? '· Already Completed (Skipped)' : ''}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={isPreviewingPlan}
              onClick={handlePreviewPlan}
              className="primary-button text-xs py-2 px-4"
            >
              <Calendar size={14} aria-hidden="true" />
              <span>{isPreviewingPlan ? 'Previewing...' : 'Preview Curriculum Plan'}</span>
            </button>
            {planPreview && (
              <>
                <button
                  type="button"
                  disabled={isApplyingPlan}
                  onClick={handleAcceptPlan}
                  className="primary-button text-xs py-2 px-4"
                >
                  <CheckCircle2 size={14} aria-hidden="true" />
                  <span>{isApplyingPlan ? 'Applying...' : 'Accept & Save Study Plan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlanPreview(null);
                    setPreviewedSnapshot(null);
                  }}
                  className="secondary-button text-xs py-2 px-3"
                >
                  <span>Cancel Preview</span>
                </button>
              </>
            )}
          </div>

          {planError && (
            <p role="alert" className="text-xs font-semibold ui-text-ink">
              {planError}
            </p>
          )}
          {planNotice && (
            <p role="status" className="text-xs font-semibold ui-text-accent">
              {planNotice}
            </p>
          )}

          {/* Preview Results */}
          {planPreview && (
            <div
              className="rounded-xl border ui-border-border ui-bg-soft p-4 space-y-3"
              aria-label="Study plan preview results"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-sm font-bold ui-text-ink">
                  Previewed Schedule ({planPreview.sessions.length} session blocks)
                </h4>
                <span
                  className={`status-badge text-xs ${
                    planPreview.deadlineConflict ? 'status-attention' : 'status-success'
                  }`}
                >
                  Est. Finish: {planPreview.estimatedFinishDate} ·{' '}
                  {planPreview.deadlineConflict ? 'Exceeds Target Date' : 'On Track'}
                </span>
              </div>

              {planPreview.sessions.length === 0 ? (
                <p className="text-xs ui-text-muted">
                  All selected lessons are already marked completed! Select uncompleted lessons or practice problems to schedule new sessions.
                </p>
              ) : (
                <ul className="space-y-1.5 text-xs ui-text-ink">
                  {planPreview.sessions.map((s, idx) => (
                    <li
                      key={`${s.itemId}-${s.partIndex}-${idx}`}
                      className="flex items-center justify-between gap-2 py-1 border-b ui-border-border"
                    >
                      <span>
                        <strong>{s.date}:</strong> {s.title}{' '}
                        {s.totalParts > 1 ? `(Part ${s.partIndex}/${s.totalParts})` : ''}
                      </span>
                      <span className="font-mono ui-text-muted">
                        {s.allocatedMinutes}m / {s.totalEstimatedMinutes}m
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {/* Active Saved Study Plan Summary */}
      {!showPlanner && savedStudyPlan && savedStudyPlan.sessions?.length > 0 && (
        <div className="rounded-xl border ui-border-border ui-bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider ui-text-accent">
              Active Curriculum Study Plan ({savedStudyPlan.sessions.length} sessions · Est. finish {savedStudyPlan.estimatedFinishDate})
            </span>
            <button
              type="button"
              onClick={() => setShowPlanner(true)}
              className="text-xs font-semibold ui-text-accent hover:underline"
            >
              Adjust Plan
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {savedStudyPlan.sessions.slice(0, 4).map((s, idx) => (
              <span
                key={`${s.itemId}-${idx}`}
                className="px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs ui-text-ink"
              >
                <strong>{s.date}:</strong> {s.title} ({s.allocatedMinutes}m)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MAP VIEW vs ACCESSIBLE LIST VIEW */}
      {displayMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Topic Cards Container (7 cols on lg, grouped into compact prerequisite stages) */}
          <div
            className="lg:col-span-7 space-y-6"
            role="list"
            data-guide="atlas-topics-map"
            aria-label="Curriculum topics map"
          >
            {groupedLanes.map(([laneNum, laneTopics]) => (
              <div key={laneNum} className="space-y-3">
                <div className="flex items-center justify-between border-b ui-border-border pb-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                    {STAGE_TITLES[laneNum] ? `Stage ${laneNum} · ${STAGE_TITLES[laneNum]}` : `Stage ${laneNum}`}
                  </h4>
                  <span className="text-xs ui-text-muted font-medium">
                    {laneTopics.length} Topics
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {laneTopics.map((topic) => {
                    const isSelected = activeTopic?.id === topic.id;
                    return (
                      <article
                        key={topic.id}
                        role="listitem"
                        className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'border-2 ui-border-accent ui-bg-surface'
                            : 'ui-border-border ui-bg-surface hover:ui-bg-soft'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                              Topic {topic.order}
                            </span>
                            <span
                              className={`status-badge text-xs ${
                                topic.status === 'completed'
                                  ? 'status-success'
                                  : topic.status === 'needs_review'
                                  ? 'status-attention'
                                  : topic.status === 'in_progress'
                                  ? 'status-accent'
                                  : 'status-neutral'
                              }`}
                            >
                              {topic.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <h3 className="text-base font-bold ui-text-ink">{topic.title}</h3>
                          <p className="text-xs ui-text-muted leading-relaxed">
                            {topic.shortDescription}
                          </p>

                          {/* Prerequisite Indicator */}
                          <div className="text-xs ui-text-muted">
                            {topic.prerequisites.length === 0 ? (
                              <span>Prerequisites: None (Entry Point)</span>
                            ) : topic.prerequisitesMet ? (
                              <span className="ui-text-accent font-semibold">
                                ✓ Prerequisites satisfied
                              </span>
                            ) : (
                              <span>
                                Recommended after:{' '}
                                {topic.missingPrerequisites.map((p) => p.title).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t ui-border-border space-y-2.5">
                          <div className="flex items-center justify-between text-xs ui-text-ink font-medium">
                            <span>
                              {topic.completedLessonsCount}/{topic.totalLessonsCount} lessons
                            </span>
                            <span>
                              {topic.completedExercisesCount}/{topic.totalExercisesCount} traces
                            </span>
                            <span>
                              {topic.solvedPracticeCount}/{topic.totalPracticeCount} practice
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onSelectTopic(topic.id)}
                              className="secondary-button text-xs py-1.5 px-3 flex-1 justify-center"
                            >
                              <span>{isSelected ? 'Inspecting Topic' : 'Inspect Topic'}</span>
                            </button>
                            {topic.nextLesson && (
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenProofLesson(
                                    topic.id,
                                    topic.nextLesson.id,
                                    topic.nextLesson.exerciseId
                                  )
                                }
                                className="primary-button text-xs py-1.5 px-3 shrink-0"
                              >
                                <span>Proof</span>
                                <ArrowRight size={12} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Immediate In-Flow Mobile Details (Visible only on mobile/tablet screens < lg) */}
                        {isSelected && (
                          <div
                            className="mt-2 pt-3 border-t ui-border-border space-y-3 block lg:hidden"
                            aria-label={`Mobile topic details: ${topic.title}`}
                          >
                            <div className="space-y-1">
                              <p className="text-xs ui-text-ink leading-relaxed">
                                <strong>Why it matters:</strong> {topic.whyItMatters}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                {topic.keyPatterns.map((pat) => (
                                  <span
                                    key={pat}
                                    className="px-2 py-0.5 rounded border ui-border-border ui-bg-soft text-[11px] font-medium ui-text-ink"
                                  >
                                    {pat}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold uppercase tracking-wider ui-text-muted block">
                                Lessons in Topic ({topic.lessons.length})
                              </span>
                              <ul className="space-y-1.5" role="list">
                                {topic.lessons.map((les) => {
                                  const prog = goal?.studyWorkspace?.lessonProgress?.[les.id];
                                  const st = prog?.status || 'not_started';
                                  return (
                                    <li
                                      key={les.id}
                                      className="rounded-lg border ui-border-border ui-bg-soft p-2.5 flex items-center justify-between gap-2"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <span className="text-xs font-semibold ui-text-ink block truncate">
                                          {les.order}. {les.title}
                                        </span>
                                        <span className="text-[11px] ui-text-muted">
                                          {les.estimatedMinutes}m ·{' '}
                                          {les.exerciseId ? 'Interactive Trace' : 'Concept'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onOpenProofLesson(topic.id, les.id, les.exerciseId)
                                          }
                                          className="primary-button text-[11px] py-1 px-2.5"
                                        >
                                          <span>{st === 'completed' ? 'Review' : 'Open'}</span>
                                        </button>
                                        {les.recommendedPracticeIds?.[0] && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              onOpenPracticeProblem(les.recommendedPracticeIds[0])
                                            }
                                            className="secondary-button text-[11px] py-1 px-2"
                                          >
                                            <span>Practice</span>
                                          </button>
                                        )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Selected Topic Inspector Panel (5 cols on lg, sticky) */}
          {activeTopic && (
            <aside
              aria-label={`Selected topic details: ${activeTopic.title}`}
              className="hidden lg:block lg:col-span-5 rounded-xl border ui-border-border ui-bg-surface p-5 space-y-4 sticky top-6"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider ui-text-accent">
                  Topic Inspector · {activeTopic.estimatedMinutes}m Total
                </span>
                <h3 className="text-lg font-bold ui-text-ink">{activeTopic.title}</h3>
                <p className="text-xs ui-text-ink leading-relaxed">
                  <strong>Why it matters:</strong> {activeTopic.whyItMatters}
                </p>
              </div>

              {/* Key Patterns */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                  Core Invariant Patterns
                </h4>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeTopic.keyPatterns.map((pat) => (
                    <span
                      key={pat}
                      className="px-2.5 py-1 rounded-lg border ui-border-border ui-bg-soft text-xs font-medium ui-text-ink"
                    >
                      {pat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lessons in Topic */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider ui-text-muted">
                  Lessons &amp; Interactive Proof Traces ({activeTopic.lessons.length})
                </h4>
                <ul className="space-y-2" role="list">
                  {activeTopic.lessons.map((les) => {
                    const prog = goal?.studyWorkspace?.lessonProgress?.[les.id];
                    const st = prog?.status || 'not_started';
                    return (
                      <li
                        key={les.id}
                        className="rounded-lg border ui-border-border ui-bg-soft p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold ui-text-ink block">
                              {les.order}. {les.title}
                            </span>
                            <span className="text-xs ui-text-muted">
                              {les.estimatedMinutes}m ·{' '}
                              {les.exerciseId ? 'Includes Proof Trace' : 'Concept & Edge Case'}
                            </span>
                          </div>
                          <span
                            className={`status-badge text-xs ${
                              st === 'completed'
                                ? 'status-success'
                                : st === 'in_progress'
                                ? 'status-accent'
                                : 'status-neutral'
                            }`}
                          >
                            {st.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenProofLesson(activeTopic.id, les.id, les.exerciseId)
                            }
                            className="primary-button text-xs py-1.5 px-3"
                          >
                            <Play size={12} aria-hidden="true" />
                            <span>
                              {st === 'completed'
                                ? 'Review in Proof'
                                : st === 'in_progress'
                                ? 'Continue in Proof'
                                : 'Start in Proof'}
                            </span>
                          </button>

                          {les.recommendedPracticeIds?.[0] && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenPracticeProblem(les.recommendedPracticeIds[0])
                              }
                              className="secondary-button text-xs py-1.5 px-2.5"
                            >
                              <span>Practice ({les.recommendedPracticeIds.length})</span>
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          )}
        </div>
      ) : (
        /* Accessible Structured List Alternative */
        <div
          className="space-y-4"
          role="list"
          aria-label="Accessible linear topic and lesson list"
        >
          {atlas.topics.map((topic) => (
            <section
              key={topic.id}
              role="listitem"
              aria-labelledby={`list-topic-${topic.id}`}
              className="rounded-xl border ui-border-border ui-bg-surface p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 id={`list-topic-${topic.id}`} className="text-base font-bold ui-text-ink">
                    {topic.order}. {topic.title}
                  </h3>
                  <p className="text-xs ui-text-muted mt-0.5">{topic.shortDescription}</p>
                </div>
                <span className="status-badge status-neutral text-xs">
                  {topic.completedLessonsCount}/{topic.totalLessonsCount} Lessons Completed
                </span>
              </div>

              <ul className="space-y-2">
                {topic.lessons.map((les) => {
                  const st =
                    goal?.studyWorkspace?.lessonProgress?.[les.id]?.status || 'not_started';
                  return (
                    <li
                      key={les.id}
                      className="rounded-lg border ui-border-border ui-bg-soft p-3 flex items-center justify-between gap-3 flex-wrap"
                    >
                      <div>
                        <div className="text-xs font-bold ui-text-ink">
                          Lesson {topic.order}.{les.order}: {les.title} ({les.estimatedMinutes}m)
                        </div>
                        <div className="text-xs ui-text-muted">{les.measurableObjective}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="status-badge status-neutral text-xs">
                          {st.replace(/_/g, ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenProofLesson(topic.id, les.id, les.exerciseId)}
                          className="primary-button text-xs py-1.5 px-3"
                        >
                          <span>Open Lesson</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
