import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Play,
  RotateCcw,
  Lightbulb,
  Eye,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Code2,
  ShieldAlert
} from 'lucide-react';
import ProofTraceRenderer from './ProofTraceRenderer.jsx';
import { apiService } from '../../services/apiService.js';

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

export default function ProofStudio({
  goal,
  catalog,
  selectedTopicId,
  selectedLessonId,
  selectedExerciseId,
  onSelectTopic,
  onSelectLesson,
  onSelectExercise,
  onSaveLessonProgress,
  onSaveExerciseAttempt,
  onOpenPracticeProblem,
  onSelectView,
  onEvaluateTraceStep,
  onEvaluateEdgeCheck,
  onEvaluateLessonCheck,
  onGetExerciseReference
}) {
  const curriculum = catalog?.curriculum || {};
  const topics = curriculum.topics || [];
  const lessons = curriculum.lessons || [];
  const exercises = curriculum.exercises || [];
  const practiceProblems = curriculum.practiceProblems || [];
  const sources = curriculum.sources || [];

  const activeTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || topics[0] || null;
  }, [topics, selectedTopicId]);

  const topicLessons = useMemo(() => {
    if (!activeTopic) return [];
    return lessons
      .filter((l) => l.topicId === activeTopic.id)
      .sort((a, b) => a.order - b.order);
  }, [lessons, activeTopic]);

  const activeLesson = useMemo(() => {
    const found = lessons.find((l) => l.id === selectedLessonId);
    if (found && (!activeTopic || found.topicId === activeTopic.id)) return found;
    return topicLessons[0] || lessons[0] || null;
  }, [lessons, topicLessons, selectedLessonId, activeTopic]);

  const topicExercises = useMemo(() => {
    if (!activeTopic) return [];
    return exercises.filter((e) => e.topicId === activeTopic.id);
  }, [exercises, activeTopic]);

  // R3: Coherent topic/lesson/exercise tuple: only resolve an exercise that is attached to activeLesson!
  const activeExercise = useMemo(() => {
    if (activeLesson?.exerciseId) {
      if (selectedExerciseId && selectedExerciseId === activeLesson.exerciseId) {
        return exercises.find((e) => e.id === selectedExerciseId) || null;
      }
      return exercises.find((e) => e.id === activeLesson.exerciseId) || null;
    }
    return null;
  }, [exercises, selectedExerciseId, activeLesson]);

  const activeExerciseId = activeExercise?.id;
  const activeLessonId = activeLesson?.id;

  const ws = goal?.studyWorkspace || {};
  const lessonRecord = activeLesson ? ws.lessonProgress?.[activeLesson.id] : null;
  const exerciseHistory = activeExercise ? ws.exerciseAttempts?.[activeExercise.id] || [] : [];

  // R3: Keyed state per item to prevent cross-exercise draft and notice leakage
  const [lessonReflections, setLessonReflections] = useState({});
  const [kcStates, setKcStates] = useState({});
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessonSaveNotice, setLessonSaveNotice] = useState('');
  const [lessonSaveError, setLessonSaveError] = useState('');

  const [exerciseReflections, setExerciseReflections] = useState({});
  const [variantKeys, setVariantKeys] = useState({});
  const [traceStates, setTraceStates] = useState({});
  const [pendingAttemptIds, setPendingAttemptIds] = useState({});
  const [referenceDataMap, setReferenceDataMap] = useState({});
  const [referenceLoadingMap, setReferenceLoadingMap] = useState({});
  const [referenceErrorMap, setReferenceErrorMap] = useState({});
  const [submittingExerciseId, setSubmittingExerciseId] = useState(null);
  const [exerciseNotices, setExerciseNotices] = useState({});
  const [exerciseErrors, setExerciseErrors] = useState({});

  const evalStepSeqRef = useRef(0);
  const evalEdgeSeqRef = useRef(0);
  const evalKcSeqRef = useRef(0);
  const refFetchSeqRef = useRef(0);

  const variantKey = (activeExerciseId && variantKeys[activeExerciseId]) || 'primary';
  const traceKey = activeExerciseId ? `${activeExerciseId}:${variantKey}` : '';

  const defaultTraceState = useMemo(() => ({
    currentStepIdx: 0,
    selectedChoiceId: null,
    stepFeedback: null,
    stepAnswersMap: {},
    mistakeCount: 0,
    hintRevealed: false,
    referenceRevealed: false,
    edgeChoiceId: null,
    edgeFeedback: null,
    edgePassed: false,
    evaluatingStepChoiceId: null,
    stepEvalError: null,
    evaluatingEdgeChoiceId: null,
    edgeEvalError: null
  }), []);

  const currentTraceState = (traceKey && traceStates[traceKey]) || defaultTraceState;

  const updateTraceState = (patchOrFn) => {
    if (!traceKey) return;
    setTraceStates((prev) => {
      const existing = prev[traceKey] || defaultTraceState;
      const patch = typeof patchOrFn === 'function' ? patchOrFn(existing) : patchOrFn;
      return {
        ...prev,
        [traceKey]: {
          ...existing,
          ...patch
        }
      };
    });
  };

  const exerciseReflection = (activeExerciseId && exerciseReflections[activeExerciseId] !== undefined)
    ? exerciseReflections[activeExerciseId]
    : '';

  const pendingAttemptId = (activeExerciseId && pendingAttemptIds[activeExerciseId]) || makeUuid();

  const lessonReflection = (activeLessonId && lessonReflections[activeLessonId] !== undefined)
    ? lessonReflections[activeLessonId]
    : (lessonRecord?.reflection || '');

  if (!activeLesson) {
    return (
      <section id="view-proof" className="workspace-content">
        <div className="workspace-empty-state">
          <h3>No lesson selected</h3>
          <p>Choose a topic from Atlas to begin interactive Proof reasoning.</p>
        </div>
      </section>
    );
  }

  const activeVariant =
    activeExercise && variantKey === 'alternate'
      ? activeExercise.alternateVariant
      : activeExercise?.primaryVariant;
  const traceSteps = activeVariant?.steps || [];
  const currentStep = traceSteps[currentTraceState.currentStepIdx] || traceSteps[0] || null;

  // Strict completion check (R1): all trace steps completed + boundary check verified
  const allStepsCompleted =
    traceSteps.length > 0 &&
    traceSteps.every((_, idx) => Boolean(currentTraceState.stepAnswersMap[idx]));
  const edgePassed = Boolean(currentTraceState.edgePassed);

  const canSaveExercise =
    Boolean(activeExercise) &&
    allStepsCompleted &&
    edgePassed &&
    submittingExerciseId !== activeExerciseId;

  const computedExerciseOutcome = currentTraceState.referenceRevealed
    ? 'needed_reference'
    : currentTraceState.hintRevealed || currentTraceState.mistakeCount > 0
    ? 'with_hint'
    : 'independent';

  const handleChooseTraceOption = async (choice) => {
    if (!activeExercise || !choice) return;
    const targetExerciseId = activeExercise.id;
    const targetVariantKey = variantKey;
    const targetStepIdx = currentTraceState.currentStepIdx;
    const targetTraceKey = `${targetExerciseId}:${targetVariantKey}`;
    const seq = ++evalStepSeqRef.current;

    // Immediately preserve student choice and set evaluating state
    setTraceStates((prev) => {
      const existing = prev[targetTraceKey] || defaultTraceState;
      return {
        ...prev,
        [targetTraceKey]: {
          ...existing,
          selectedChoiceId: choice.id,
          evaluatingStepChoiceId: choice.id,
          stepEvalError: null
        }
      };
    });

    try {
      const evalFn = onEvaluateTraceStep || apiService.evaluateTraceStep;
      const res = await evalFn({
        exerciseId: targetExerciseId,
        variantKey: targetVariantKey,
        stepIndex: targetStepIdx,
        choiceId: choice.id
      });

      // Discard out-of-order or stale response if another evaluation started
      if (seq !== evalStepSeqRef.current) return;

      const data = res?.data || res;
      setTraceStates((prev) => {
        const existing = prev[targetTraceKey] || defaultTraceState;
        // Verify currentStepIdx still matches
        if (existing.currentStepIdx !== targetStepIdx) return prev;

        if (data.isCorrect) {
          return {
            ...prev,
            [targetTraceKey]: {
              ...existing,
              evaluatingStepChoiceId: null,
              stepEvalError: null,
              stepFeedback: {
                isCorrect: true,
                text: data.feedback || 'Correct state transition.',
                explanation: data.explanation || currentStep?.correctExplanation || null
              },
              stepAnswersMap: {
                ...existing.stepAnswersMap,
                [targetStepIdx]: choice.id
              }
            }
          };
        } else {
          return {
            ...prev,
            [targetTraceKey]: {
              ...existing,
              evaluatingStepChoiceId: null,
              stepEvalError: null,
              mistakeCount: existing.mistakeCount + 1,
              stepFeedback: {
                isCorrect: false,
                text: data.feedback || 'Misconception detected — check the invariant.',
                explanation: null
              }
            }
          };
        }
      });
    } catch (err) {
      if (seq !== evalStepSeqRef.current) return;
      setTraceStates((prev) => {
        const existing = prev[targetTraceKey] || defaultTraceState;
        return {
          ...prev,
          [targetTraceKey]: {
            ...existing,
            evaluatingStepChoiceId: null,
            stepEvalError: err?.message || 'Verification service temporarily unavailable. Your answer is preserved.'
          }
        };
      });
    }
  };

  const handleChooseEdgeOption = async (choice) => {
    if (!activeExercise || !choice) return;
    const targetExerciseId = activeExercise.id;
    const targetVariantKey = variantKey;
    const targetTraceKey = `${targetExerciseId}:${targetVariantKey}`;
    const seq = ++evalEdgeSeqRef.current;

    // Immediately preserve student choice and set evaluating state
    setTraceStates((prev) => {
      const existing = prev[targetTraceKey] || defaultTraceState;
      return {
        ...prev,
        [targetTraceKey]: {
          ...existing,
          edgeChoiceId: choice.id,
          evaluatingEdgeChoiceId: choice.id,
          edgeEvalError: null
        }
      };
    });

    try {
      const evalFn = onEvaluateEdgeCheck || apiService.evaluateEdgeCheck;
      const res = await evalFn({
        exerciseId: targetExerciseId,
        choiceId: choice.id
      });

      if (seq !== evalEdgeSeqRef.current) return;

      const data = res?.data || res;
      setTraceStates((prev) => {
        const existing = prev[targetTraceKey] || defaultTraceState;
        if (data.isCorrect) {
          return {
            ...prev,
            [targetTraceKey]: {
              ...existing,
              edgePassed: true,
              evaluatingEdgeChoiceId: null,
              edgeEvalError: null,
              edgeFeedback: {
                isCorrect: true,
                text: data.feedback || 'Boundary condition verified.',
                explanation: data.explanation || activeExercise?.edgeCaseCheck?.explanation || null
              }
            }
          };
        } else {
          return {
            ...prev,
            [targetTraceKey]: {
              ...existing,
              edgePassed: false,
              evaluatingEdgeChoiceId: null,
              edgeEvalError: null,
              mistakeCount: existing.mistakeCount + 1,
              edgeFeedback: {
                isCorrect: false,
                text: data.feedback || 'Boundary condition needs review.',
                explanation: null
              }
            }
          };
        }
      });
    } catch (err) {
      if (seq !== evalEdgeSeqRef.current) return;
      setTraceStates((prev) => {
        const existing = prev[targetTraceKey] || defaultTraceState;
        return {
          ...prev,
          [targetTraceKey]: {
            ...existing,
            evaluatingEdgeChoiceId: null,
            edgeEvalError: err?.message || 'Boundary verification unavailable. Your answer is preserved.'
          }
        };
      });
    }
  };

  const handleRevealReference = async () => {
    if (!activeExercise) return;
    const targetExerciseId = activeExercise.id;
    if (referenceDataMap[targetExerciseId]) {
      updateTraceState({ referenceRevealed: true });
      return;
    }

    const seq = ++refFetchSeqRef.current;
    setReferenceLoadingMap((prev) => ({ ...prev, [targetExerciseId]: true }));
    setReferenceErrorMap((prev) => ({ ...prev, [targetExerciseId]: null }));

    try {
      const refFn = onGetExerciseReference || apiService.getExerciseReference;
      const res = await refFn(targetExerciseId);
      if (seq !== refFetchSeqRef.current) return;

      const data = res?.data || res;
      setReferenceDataMap((prev) => ({
        ...prev,
        [targetExerciseId]: data
      }));
      setReferenceLoadingMap((prev) => ({ ...prev, [targetExerciseId]: false }));
      updateTraceState({ referenceRevealed: true });
    } catch (err) {
      if (seq !== refFetchSeqRef.current) return;
      setReferenceLoadingMap((prev) => ({ ...prev, [targetExerciseId]: false }));
      setReferenceErrorMap((prev) => ({
        ...prev,
        [targetExerciseId]: err?.message || 'Reference solution could not be retrieved. Click to retry.'
      }));
    }
  };

  const handleRecordExerciseAttempt = async (e) => {
    e.preventDefault();
    if (!activeExercise || !onSaveExerciseAttempt || !canSaveExercise) return;
    const targetExerciseId = activeExercise.id;
    setSubmittingExerciseId(targetExerciseId);
    setExerciseErrors((prev) => ({ ...prev, [targetExerciseId]: '' }));
    setExerciseNotices((prev) => ({ ...prev, [targetExerciseId]: '' }));
    try {
      const stepAnswers = traceSteps.map((_, idx) => ({
        stepIndex: idx,
        choiceId: currentTraceState.stepAnswersMap[idx]
      }));
      const res = await onSaveExerciseAttempt({
        attemptId: pendingAttemptId,
        exerciseId: targetExerciseId,
        variantKey,
        stepAnswers,
        edgeChoiceId: currentTraceState.edgeChoiceId,
        mistakeCount: currentTraceState.mistakeCount,
        hintRevealed: currentTraceState.hintRevealed,
        referenceRevealed: currentTraceState.referenceRevealed,
        reflection: exerciseReflection.trim() || null
      });
      const savedAttempt = res?.exerciseAttempt || res?.data?.exerciseAttempt;
      const due = savedAttempt?.nextReviewDate;
      const savedOutcome = savedAttempt?.outcome || computedExerciseOutcome;
      setExerciseNotices((prev) => ({
        ...prev,
        [targetExerciseId]: `Proof attempt saved (${savedOutcome.replace(/_/g, ' ')})${due ? ` · Next review: ${due}` : ''}.`
      }));
      setPendingAttemptIds((prev) => ({ ...prev, [targetExerciseId]: makeUuid() }));
    } catch (err) {
      setExerciseErrors((prev) => ({
        ...prev,
        [targetExerciseId]: err.message || 'Could not save Proof exercise attempt.'
      }));
    } finally {
      setSubmittingExerciseId(null);
    }
  };

  const handleSelectKnowledgeCheckOption = async (opt) => {
    if (!activeLesson || !opt) return;
    const targetLessonId = activeLesson.id;
    const seq = ++evalKcSeqRef.current;

    setKcStates((prev) => ({
      ...prev,
      [targetLessonId]: {
        ...(prev[targetLessonId] || {}),
        selectedOption: opt.id,
        evaluating: true,
        evalError: null
      }
    }));

    try {
      const evalFn = onEvaluateLessonCheck || apiService.evaluateLessonCheck;
      const res = await evalFn({
        lessonId: targetLessonId,
        optionId: opt.id
      });

      if (seq !== evalKcSeqRef.current) return;

      const data = res?.data || res;
      setKcStates((prev) => ({
        ...prev,
        [targetLessonId]: {
          selectedOption: opt.id,
          submitted: true,
          isCorrect: Boolean(data.isCorrect),
          feedback: data.feedback || '',
          explanation: data.explanation || null,
          evaluating: false,
          evalError: null
        }
      }));
    } catch (err) {
      if (seq !== evalKcSeqRef.current) return;
      setKcStates((prev) => ({
        ...prev,
        [targetLessonId]: {
          ...(prev[targetLessonId] || {}),
          selectedOption: opt.id,
          submitted: false,
          evaluating: false,
          evalError: err?.message || 'Invariant check verification unavailable. Your selection is preserved.'
        }
      }));
    }
  };

  const handleMarkLessonStatus = async (status) => {
    if (!activeLesson || !onSaveLessonProgress) return;
    setIsSavingLesson(true);
    setLessonSaveError('');
    setLessonSaveNotice('');
    try {
      const currentKc = kcStates[activeLesson.id];
      await onSaveLessonProgress({
        requestId: makeUuid(),
        lessonId: activeLesson.id,
        topicId: activeLesson.topicId,
        status,
        completedSections:
          status === 'completed'
            ? ['explanation', 'worked_example', 'edge_case', 'knowledge_check']
            : ['explanation', 'worked_example'],
        reflection: lessonReflection.trim() || null,
        knowledgeCheckOptionId: currentKc?.selectedOption || undefined,
        knowledgeCheckPassed: Boolean(currentKc?.isCorrect)
      });
      setLessonSaveNotice(
        status === 'completed'
          ? 'Lesson marked completed and saved to your study workspace!'
          : 'Lesson progress & notes saved.'
      );
    } catch (err) {
      setLessonSaveError(err.message || 'Could not save lesson progress.');
    } finally {
      setIsSavingLesson(false);
    }
  };

  const linkedPractice = practiceProblems.filter((p) =>
    activeLesson.recommendedPracticeIds?.includes(p.id)
  );
  const sourceEntry = sources.find((s) => s.id === activeLesson.sourceId);

  return (
    <section
      id="view-proof"
      role="region"
      aria-labelledby="proof-heading"
      className="workspace-content space-y-6"
    >
      {/* Studio Header & Topic/Lesson Switcher */}
      <div className="rounded-xl border ui-border-border ui-bg-surface p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="status-badge status-accent text-xs">
                Proof Reasoning Studio
              </span>
              <span className="text-xs font-semibold ui-text-muted">
                {activeTopic?.title} · Lesson {activeLesson.order} of {topicLessons.length}
              </span>
            </div>
            <h2 id="proof-heading" className="text-xl font-bold ui-text-ink tracking-tight mt-1">
              {activeLesson.title}
            </h2>
            <p className="text-sm ui-text-muted mt-1">
              <strong>Objective:</strong> {activeLesson.measurableObjective}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`status-badge text-xs ${
                lessonRecord?.status === 'completed'
                  ? 'status-success'
                  : lessonRecord?.status === 'in_progress'
                  ? 'status-accent'
                  : 'status-neutral'
              }`}
            >
              {lessonRecord?.status === 'completed'
                ? 'Lesson Completed'
                : lessonRecord?.status === 'in_progress'
                ? 'In Progress'
                : `${activeLesson.estimatedMinutes}m Est.`}
            </span>
            <button
              type="button"
              onClick={() => onSelectView('atlas')}
              className="secondary-button text-xs py-1.5 px-3"
            >
              <span>Back to Atlas</span>
            </button>
          </div>
        </div>

        {/* Topic & Lesson Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t ui-border-border">
          <div>
            <label htmlFor="proof-topic-select" className="block text-xs font-semibold ui-text-muted mb-1">
              Topic Path
            </label>
            <select
              id="proof-topic-select"
              value={activeTopic?.id || ''}
              onChange={(e) => {
                const nextTopicId = e.target.value;
                onSelectTopic(nextTopicId);
                const firstLesson = lessons
                  .filter((l) => l.topicId === nextTopicId)
                  .sort((a, b) => a.order - b.order)[0];
                if (firstLesson) {
                  onSelectLesson(firstLesson.id);
                  if (firstLesson.exerciseId) onSelectExercise(firstLesson.exerciseId);
                }
              }}
              className="w-full rounded-lg border ui-border-border ui-bg-soft px-3 py-2 text-sm font-medium ui-text-ink"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.order}. {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="proof-lesson-select" className="block text-xs font-semibold ui-text-muted mb-1">
              Lesson in Topic
            </label>
            <select
              id="proof-lesson-select"
              value={activeLesson.id}
              onChange={(e) => {
                const nextLesson = lessons.find((l) => l.id === e.target.value);
                if (nextLesson) {
                  onSelectLesson(nextLesson.id);
                  if (nextLesson.exerciseId) onSelectExercise(nextLesson.exerciseId);
                }
              }}
              className="w-full rounded-lg border ui-border-border ui-bg-soft px-3 py-2 text-sm font-medium ui-text-ink"
            >
              {topicLessons.map((l) => {
                const st = goal?.studyWorkspace?.lessonProgress?.[l.id]?.status;
                const tag = st === 'completed' ? ' (Done)' : st === 'in_progress' ? ' (Started)' : '';
                return (
                  <option key={l.id} value={l.id}>
                    {l.order}. {l.title} ({l.estimatedMinutes}m){tag}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 1: Core Concept, Code & Worked Example */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Explanation + Pitfalls + Edge Case */}
        <div className="rounded-xl border ui-border-border ui-bg-surface p-5 space-y-4">
          <h3 className="text-base font-bold ui-text-ink flex items-center gap-2">
            <BookOpen size={16} className="ui-text-accent" aria-hidden="true" />
            <span>Concept &amp; Invariant Mechanics</span>
          </h3>
          <p className="text-sm ui-text-ink leading-relaxed">{activeLesson.explanation}</p>

          {/* Worked Example */}
          <div className="rounded-lg border ui-border-border ui-bg-soft p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider ui-text-accent">
                Worked Example
              </span>
              <span className="text-xs font-mono ui-text-ink">
                {activeLesson.workedExample.inputDescription}
              </span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs ui-text-ink">
              {activeLesson.workedExample.stepByStep.map((s, idx) => (
                <li key={idx} className="leading-relaxed">
                  {s}
                </li>
              ))}
            </ol>
            <div className="pt-2 border-t ui-border-border text-xs ui-text-ink space-y-1">
              <div>
                <strong>Output:</strong> {activeLesson.workedExample.outputDescription}
              </div>
              <div>
                <strong>Invariant:</strong> {activeLesson.workedExample.invariantSummary}
              </div>
            </div>
          </div>

          {/* Edge Case & Common Pitfalls */}
          <div className="rounded-lg border ui-border-border ui-bg-soft p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider ui-text-ink">
              <ShieldAlert size={14} className="ui-text-accent" aria-hidden="true" />
              <span>Boundary &amp; Edge-Case Analysis</span>
            </div>
            <p className="text-xs ui-text-ink">
              <strong>Scenario:</strong> {activeLesson.edgeCase.scenario}
            </p>
            <p className="text-xs ui-text-muted">
              <strong>Why naive code fails:</strong> {activeLesson.edgeCase.whyItBreaksNaiveCode}
            </p>
            <p className="text-xs ui-text-ink">
              <strong>Invariant fix:</strong> {activeLesson.edgeCase.howToHandle}
            </p>
          </div>
        </div>

        {/* Right: Annotated Reference Code + Knowledge Check */}
        <div className="rounded-xl border ui-border-border ui-bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-base font-bold ui-text-ink flex items-center gap-2">
              <Code2 size={16} className="ui-text-accent" aria-hidden="true" />
              <span>Reference Implementation ({activeLesson.codeSnippet.filename})</span>
            </h3>
            <span className="status-badge status-neutral text-xs font-mono">
              {activeLesson.codeSnippet.language}
            </span>
          </div>

          <pre
            className="rounded-lg border ui-border-border ui-bg-soft p-3.5 text-xs font-mono ui-text-ink overflow-x-auto leading-relaxed"
            aria-label={`Code snippet ${activeLesson.codeSnippet.filename}`}
          >
            {activeLesson.codeSnippet.lines.map((line, i) => (
              <div key={i} className="flex gap-3">
                <span className="ui-text-muted select-none w-5 text-right">{i + 1}</span>
                <span>{line}</span>
              </div>
            ))}
          </pre>

          {/* Common Pitfalls */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider ui-text-muted">
              Common Pitfalls to Avoid
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs ui-text-ink">
              {activeLesson.pitfalls.map((pitfall, idx) => (
                <li key={idx}>{pitfall}</li>
              ))}
            </ul>
          </div>

          {/* Lesson Knowledge Check */}
          <div className="rounded-lg border ui-border-border ui-bg-soft p-4 space-y-3">
            <h4 className="text-sm font-bold ui-text-ink">
              Quick Invariant Check
            </h4>
            <p className="text-xs ui-text-ink">{activeLesson.knowledgeCheck.question}</p>
            <div className="space-y-2" role="radiogroup" aria-label="Lesson invariant check">
              {activeLesson.knowledgeCheck.options.map((opt) => {
                const currentKc = kcStates[activeLesson.id];
                const isSelected = currentKc?.selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectKnowledgeCheckOption(opt)}
                    className={`w-full text-left rounded-lg border p-2.5 text-xs transition-colors ${
                      isSelected
                        ? 'ui-border-accent ui-bg-surface font-semibold ui-text-ink'
                        : 'ui-border-border ui-bg-surface ui-text-ink hover:ui-bg-soft'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {kcStates[activeLesson.id]?.evaluating && (
              <div role="status" className="text-xs ui-text-muted flex items-center gap-1.5 py-1">
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-ping" />
                <span>Evaluating invariant check...</span>
              </div>
            )}

            {kcStates[activeLesson.id]?.evalError && (
              <div
                role="alert"
                className="rounded-lg border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-200 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span>{kcStates[activeLesson.id].evalError}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const selectedId = kcStates[activeLesson.id]?.selectedOption;
                      const opt = activeLesson.knowledgeCheck?.options.find((o) => o.id === selectedId);
                      if (opt) handleSelectKnowledgeCheckOption(opt);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-900/60 dark:hover:bg-red-900 dark:text-red-100 transition-colors"
                  >
                    Retry Invariant Check
                  </button>
                </div>
              </div>
            )}

            {kcStates[activeLesson.id]?.submitted && (
              <div
                role="status"
                className="rounded-lg border ui-border-border ui-bg-surface p-3 text-xs ui-text-ink"
              >
                <strong>
                  {kcStates[activeLesson.id]?.isCorrect
                    ? '✓ On track: '
                    : '↻ Re-check invariant: '}
                </strong>
                {kcStates[activeLesson.id]?.feedback}
                {kcStates[activeLesson.id]?.isCorrect && kcStates[activeLesson.id]?.explanation && (
                  <p className="mt-1 ui-text-muted">{kcStates[activeLesson.id].explanation}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Interactive Proof Trace Exercise */}
      {activeExercise ? (
        <section
          aria-labelledby="interactive-exercise-heading"
          className="rounded-xl border ui-border-border ui-bg-surface p-5 space-y-5"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="status-badge status-accent text-xs">
                  Interactive Proof Trace
                </span>
                {topicExercises.length > 1 && (
                  <div className="flex items-center gap-1">
                    {topicExercises.map((ex, i) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => onSelectExercise(ex.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          ex.id === activeExercise.id
                            ? 'ui-border-accent ui-bg-soft ui-text-ink'
                            : 'ui-border-border ui-bg-surface ui-text-muted'
                        }`}
                      >
                        Exercise {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <h3 id="interactive-exercise-heading" className="text-lg font-bold ui-text-ink mt-1">
                {activeExercise.title}
              </h3>
              <p className="text-sm ui-text-muted mt-0.5">{activeExercise.instructions}</p>
            </div>

            {/* Try Another Input / Reset Trace Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() =>
                  setVariantKeys((prev) => ({
                    ...prev,
                    [activeExerciseId]: variantKey === 'primary' ? 'alternate' : 'primary'
                  }))
                }
                className="secondary-button text-xs py-1.5 px-3"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span>
                  {variantKey === 'primary'
                    ? `Try Alternate Input (${activeExercise.alternateVariant.label})`
                    : `Back to Primary Input (${activeExercise.primaryVariant.label})`}
                </span>
              </button>
              <button
                type="button"
                onClick={() => updateTraceState({ hintRevealed: true })}
                className="secondary-button text-xs py-1.5 px-3"
              >
                <Lightbulb size={13} aria-hidden="true" />
                <span>{currentTraceState.hintRevealed ? 'Hint Revealed' : 'Reveal Hint'}</span>
              </button>
              <button
                type="button"
                onClick={handleRevealReference}
                disabled={Boolean(referenceLoadingMap[activeExerciseId])}
                className="secondary-button text-xs py-1.5 px-3"
              >
                <Eye size={13} aria-hidden="true" />
                <span>
                  {referenceLoadingMap[activeExerciseId]
                    ? 'Fetching Reference...'
                    : currentTraceState.referenceRevealed
                    ? 'Invariant Revealed'
                    : 'Reveal Reference Invariant'}
                </span>
              </button>
            </div>
            {referenceErrorMap[activeExerciseId] && (
              <div
                role="alert"
                className="w-full rounded-lg border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-200 flex items-center justify-between gap-2 flex-wrap"
              >
                <span>{referenceErrorMap[activeExerciseId]}</span>
                <button
                  type="button"
                  onClick={handleRevealReference}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-900/60 dark:hover:bg-red-900 dark:text-red-100 transition-colors"
                >
                  Retry Reveal Reference
                </button>
              </div>
            )}
          </div>

          {/* Active Input Banner */}
          <div className="flex items-center justify-between gap-2 flex-wrap rounded-lg border ui-border-border ui-bg-soft px-3.5 py-2 text-xs">
            <span className="font-mono font-semibold ui-text-ink">
              Active Input ({activeVariant.label}): {activeVariant.inputLabel}
            </span>
            <span className="ui-text-muted">
              Step {currentTraceState.currentStepIdx + 1} of {traceSteps.length} · Mistakes: {currentTraceState.mistakeCount}
            </span>
          </div>

          {currentTraceState.hintRevealed && (
            <div className="rounded-lg border ui-border-border ui-bg-soft p-3 text-xs ui-text-ink">
              <strong>Trace Hint:</strong> {activeExercise.hintText}
            </div>
          )}

          {currentTraceState.referenceRevealed && (
            <div className="rounded-lg border ui-border-border ui-bg-soft p-3 text-xs ui-text-ink space-y-1">
              <div>
                <strong>Reference Loop Invariant:</strong>{' '}
                {referenceDataMap[activeExerciseId]?.referenceInvariant || activeExercise.referenceInvariant}
              </div>
              <div className="text-xs ui-text-muted">
                {referenceDataMap[activeExerciseId]?.edgeCaseNote || activeVariant.edgeCaseNote}
              </div>
              {referenceDataMap[activeExerciseId]?.referenceImplementation && (
                <div className="mt-2 pt-2 border-t ui-border-border">
                  <div className="text-xs font-mono font-bold text-accent mb-1">
                    Verified Reference Code ({referenceDataMap[activeExerciseId].referenceImplementation.filename}):
                  </div>
                  <pre className="p-2 rounded bg-black/10 dark:bg-black/30 font-mono text-[11px] overflow-x-auto">
                    {referenceDataMap[activeExerciseId].referenceImplementation.code}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Split Trace View: Highlighted Code + State Diagram & Step Choices */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Code Lines with Active Line Highlight */}
            <div className="lg:col-span-5 rounded-xl border ui-border-border ui-bg-soft p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-semibold ui-text-muted">
                <span>Execution Trace Code</span>
                {currentStep && (
                  <span className="font-mono ui-text-accent">
                    Active Line {currentStep.activeCodeLine}
                  </span>
                )}
              </div>
              <pre className="text-xs font-mono ui-text-ink overflow-x-auto leading-relaxed">
                {activeExercise.codeLines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isActiveLine = currentStep?.activeCodeLine === lineNum;
                  return (
                    <div
                      key={lineNum}
                      className={`flex gap-2.5 px-2 py-0.5 rounded ${
                        isActiveLine ? 'ui-bg-surface border ui-border-accent font-bold' : ''
                      }`}
                    >
                      <span className="ui-text-muted select-none w-5 text-right">{lineNum}</span>
                      <span>{line}</span>
                    </div>
                  );
                })}
              </pre>
            </div>

            {/* State Snapshot + Checkpoint Question */}
            <div className="lg:col-span-7 space-y-4">
              {currentStep && (
                <>
                  <ProofTraceRenderer
                    rendererType={activeExercise.rendererType}
                    stateSnapshot={currentStep.stateSnapshot}
                  />

                  {/* Step Navigation Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {traceSteps.map((st, idx) => {
                      const done = Boolean(currentTraceState.stepAnswersMap[idx]);
                      const isCurr = idx === currentTraceState.currentStepIdx;
                      return (
                        <button
                          key={st.stepIndex}
                          type="button"
                          onClick={() => {
                            updateTraceState({
                              currentStepIdx: idx,
                              selectedChoiceId: null,
                              stepFeedback: null
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            isCurr
                              ? 'ui-border-accent ui-bg-soft ui-text-ink'
                              : done
                              ? 'ui-border-border ui-bg-surface ui-text-accent'
                              : 'ui-border-border ui-bg-surface ui-text-muted'
                          }`}
                        >
                          {done ? `✓ Step ${idx + 1}` : `Step ${idx + 1}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Step Checkpoint Prompt & Choices */}
                  <div className="rounded-xl border ui-border-border ui-bg-soft p-4 space-y-3">
                    <h4 className="text-sm font-bold ui-text-ink">
                      Checkpoint {currentTraceState.currentStepIdx + 1}: {currentStep.prompt}
                    </h4>

                    <div className="space-y-2" role="group" aria-label="Trace step choices">
                      {currentStep.choices.map((ch) => {
                        const isPicked = currentTraceState.selectedChoiceId === ch.id;
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => handleChooseTraceOption(ch)}
                            className={`w-full text-left rounded-lg border p-3 text-xs transition-colors ${
                              isPicked
                                ? 'ui-border-accent ui-bg-surface font-semibold ui-text-ink'
                                : 'ui-border-border ui-bg-surface ui-text-ink hover:ui-bg-soft'
                            }`}
                          >
                            <div>{ch.label}</div>
                            {ch.codeHint && (
                              <div className="font-mono ui-text-muted mt-1">{ch.codeHint}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {currentTraceState.evaluatingStepChoiceId && (
                      <div role="status" className="text-xs ui-text-muted flex items-center gap-1.5 py-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-accent animate-ping" />
                        <span>Verifying state transition...</span>
                      </div>
                    )}

                    {currentTraceState.stepEvalError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span>{currentTraceState.stepEvalError}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const pickedChoice = currentStep?.choices.find((c) => c.id === currentTraceState.selectedChoiceId);
                              if (pickedChoice) handleChooseTraceOption(pickedChoice);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-900/60 dark:hover:bg-red-900 dark:text-red-100 transition-colors"
                          >
                            Retry Verification
                          </button>
                        </div>
                      </div>
                    )}

                    {currentTraceState.stepFeedback && (
                      <div
                        role="status"
                        className="rounded-lg border ui-border-border ui-bg-surface p-3.5 text-xs space-y-1.5 ui-text-ink"
                      >
                        <div className="font-bold">
                          {currentTraceState.stepFeedback.isCorrect
                            ? '✓ Correct State Transition'
                            : '⚠ Misconception Detected — Check the Invariant'}
                        </div>
                        <p>{currentTraceState.stepFeedback.text}</p>
                        {currentTraceState.stepFeedback.explanation && (
                          <p className="ui-text-muted">{currentTraceState.stepFeedback.explanation}</p>
                        )}
                        {currentTraceState.stepFeedback.isCorrect &&
                          currentTraceState.currentStepIdx < traceSteps.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                updateTraceState((prev) => ({
                                  currentStepIdx: prev.currentStepIdx + 1,
                                  selectedChoiceId: null,
                                  stepFeedback: null
                                }));
                              }}
                              className="primary-button text-xs py-1.5 px-3 mt-2"
                            >
                              <span>Advance to Step {currentTraceState.currentStepIdx + 2}</span>
                              <ArrowRight size={13} aria-hidden="true" />
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Edge-Case Verification Check */}
          {activeExercise.edgeCaseCheck && (
            <div className="rounded-xl border ui-border-border ui-bg-soft p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-sm font-bold ui-text-ink">
                  Boundary &amp; Edge-Case Verification
                </h4>
                {allStepsCompleted && (
                  <span className="status-badge status-success text-xs">
                    All {traceSteps.length} trace steps verified
                  </span>
                )}
              </div>
              <p className="text-xs ui-text-ink">{activeExercise.edgeCaseCheck.question}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {activeExercise.edgeCaseCheck.choices.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleChooseEdgeOption(ch)}
                    className={`text-left rounded-lg border p-3 text-xs ${
                      currentTraceState.edgeChoiceId === ch.id
                        ? 'ui-border-accent ui-bg-surface font-semibold ui-text-ink'
                        : 'ui-border-border ui-bg-surface ui-text-ink hover:ui-bg-soft'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              {currentTraceState.evaluatingEdgeChoiceId && (
                <div role="status" className="text-xs ui-text-muted flex items-center gap-1.5 py-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span>Verifying boundary case...</span>
                </div>
              )}

              {currentTraceState.edgeEvalError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span>{currentTraceState.edgeEvalError}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const pickedChoice = activeExercise?.edgeCaseCheck?.choices.find((c) => c.id === currentTraceState.edgeChoiceId);
                        if (pickedChoice) handleChooseEdgeOption(pickedChoice);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-900/60 dark:hover:bg-red-900 dark:text-red-100 transition-colors"
                    >
                      Retry Boundary Check
                    </button>
                  </div>
                </div>
              )}

              {currentTraceState.edgeFeedback && (
                <div
                  role="status"
                  className="rounded-lg border ui-border-border ui-bg-surface p-3 text-xs ui-text-ink"
                >
                  <strong>
                    {currentTraceState.edgeFeedback.isCorrect ? '✓ Edge case verified: ' : '↻ Boundary check: '}
                  </strong>
                  {currentTraceState.edgeFeedback.text}
                  {currentTraceState.edgeFeedback.isCorrect && currentTraceState.edgeFeedback.explanation && (
                    <p className="mt-1 ui-text-muted">{currentTraceState.edgeFeedback.explanation}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Save Proof Attempt & Reflection Form */}
          <form
            onSubmit={handleRecordExerciseAttempt}
            className="rounded-xl border ui-border-border ui-bg-soft p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-sm font-bold ui-text-ink">
                Record Proof Trace Attempt &amp; Reflection
              </h4>
              <span className="status-badge status-neutral text-xs">
                Current Mode: {computedExerciseOutcome.replace(/_/g, ' ')}
              </span>
            </div>
            <label htmlFor="proof-exercise-reflection" className="block text-xs ui-text-muted">
              {activeExercise.reflectionPrompt}
            </label>
            <textarea
              id="proof-exercise-reflection"
              rows={2}
              maxLength={500}
              value={exerciseReflection}
              onChange={(e) => {
                const val = e.target.value;
                setExerciseReflections((prev) => ({ ...prev, [activeExerciseId]: val }));
                setPendingAttemptIds((prev) => ({ ...prev, [activeExerciseId]: makeUuid() }));
              }}
              placeholder="Write a 1-sentence invariant takeaway from this trace..."
              className="w-full rounded-lg border ui-border-border ui-bg-surface p-2.5 text-xs ui-text-ink"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="submit"
                disabled={!canSaveExercise}
                className={`primary-button text-xs py-2 px-4 ${
                  !canSaveExercise ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>
                  {submittingExerciseId === activeExerciseId ? 'Saving Proof Attempt...' : 'Save Proof Attempt'}
                </span>
              </button>

              {!canSaveExercise && (
                <span className="text-xs ui-text-muted">
                  {!allStepsCompleted
                    ? `Complete all ${traceSteps.length} trace steps (${Object.keys(currentTraceState.stepAnswersMap).length}/${traceSteps.length} verified)`
                    : !edgePassed
                    ? 'Verify boundary & edge-case check'
                    : ''} to enable saving.
                </span>
              )}

              {exerciseHistory.length > 0 && (
                <span className="text-xs font-medium ui-text-muted">
                  {exerciseHistory.length} saved attempt{exerciseHistory.length === 1 ? '' : 's'} · Latest due:{' '}
                  {exerciseHistory[exerciseHistory.length - 1].nextReviewDate}
                </span>
              )}
            </div>

            {exerciseNotices[activeExerciseId] && (
              <p role="status" className="text-xs font-semibold ui-text-accent">
                {exerciseNotices[activeExerciseId]}
              </p>
            )}
            {exerciseErrors[activeExerciseId] && (
              <p role="alert" className="text-xs font-semibold ui-text-ink">
                {exerciseErrors[activeExerciseId]}
              </p>
            )}
          </form>
        </section>
      ) : (
        <section className="rounded-xl border ui-border-border ui-bg-surface p-5 text-center space-y-1.5">
          <h4 className="text-sm font-bold ui-text-ink">No Interactive Proof Trace Attached to this Lesson</h4>
          <p className="text-xs ui-text-muted max-w-lg mx-auto">
            This lesson covers core concepts, worked examples, and boundary invariants. Select a lesson with an interactive Proof exercise from Atlas or continue to the practice problems below.
          </p>
        </section>
      )}

      {/* SECTION 3: Lesson Completion, Reflection & Recommended External Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lesson Progress & Reflection Card */}
        <div className="rounded-xl border ui-border-border ui-bg-surface p-5 space-y-3">
          <h3 className="text-base font-bold ui-text-ink">
            Lesson Reflection &amp; Completion
          </h3>
          <label htmlFor="lesson-reflection-input" className="block text-xs ui-text-muted">
            {activeLesson.reflectionPrompt}
          </label>
          <textarea
            id="lesson-reflection-input"
            rows={2}
            maxLength={500}
            value={lessonReflection}
            onChange={(e) => {
              const val = e.target.value;
              setLessonReflections((prev) => ({ ...prev, [activeLessonId]: val }));
            }}
            placeholder="Summarize the key invariant or edge case in your own words..."
            className="w-full rounded-lg border ui-border-border ui-bg-soft p-2.5 text-xs ui-text-ink"
          />
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={isSavingLesson}
              onClick={() => handleMarkLessonStatus('completed')}
              className="primary-button text-xs py-2 px-4"
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>
                {lessonRecord?.status === 'completed'
                  ? 'Update Completed Lesson'
                  : 'Mark Lesson Complete'}
              </span>
            </button>
            <button
              type="button"
              disabled={isSavingLesson}
              onClick={() => handleMarkLessonStatus('in_progress')}
              className="secondary-button text-xs py-2 px-3.5"
            >
              <span>Save as In-Progress</span>
            </button>
          </div>
          {lessonSaveNotice && (
            <p role="status" className="text-xs font-semibold ui-text-accent">
              {lessonSaveNotice}
            </p>
          )}
          {lessonSaveError && (
            <p role="alert" className="text-xs font-semibold ui-text-ink">
              {lessonSaveError}
            </p>
          )}
        </div>

        {/* Linked External Practice Problems */}
        <div className="rounded-xl border ui-border-border ui-bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-base font-bold ui-text-ink">
              Recommended External Practice ({linkedPractice.length})
            </h3>
            <button
              type="button"
              onClick={() => onSelectView('practice')}
              className="text-xs font-semibold ui-text-accent hover:underline inline-flex items-center gap-1"
            >
              <span>Open Practice Library</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
          <p className="text-xs ui-text-muted">
            Apply this lesson&apos;s invariant on curated external problems. Record your self-reported outcome in Practice.
          </p>
          <ul className="space-y-2.5">
            {linkedPractice.map((prob) => {
              const attempts = goal?.studyWorkspace?.practiceAttempts?.[prob.id] || [];
              const latest = attempts.length > 0 ? attempts[attempts.length - 1] : null;
              return (
                <li
                  key={prob.id}
                  className="rounded-lg border ui-border-border ui-bg-soft p-3 flex items-start justify-between gap-3 flex-wrap"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs ui-text-ink">{prob.title}</span>
                      <span className="status-badge status-neutral text-xs">{prob.difficulty}</span>
                      {latest && (
                        <span className="status-badge status-success text-xs">
                          Logged: {latest.outcome.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs ui-text-muted">{prob.whyRecommended}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPracticeProblem(prob.id)}
                      className="secondary-button text-xs py-1.5 px-2.5"
                    >
                      <span>Log Attempt</span>
                    </button>
                    <a
                      href={prob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button text-xs py-1.5 px-2.5 inline-flex items-center gap-1"
                    >
                      <span>{prob.provider}</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Source & Provenance Footer */}
      <div className="rounded-xl border ui-border-border ui-bg-soft p-4 text-xs ui-text-muted space-y-1" role="note">
        <div>
          <strong className="ui-text-ink">Source &amp; Provenance:</strong> {activeLesson.provenance}
        </div>
        {sourceEntry && (
          <div>
            <strong>Attribution ({sourceEntry.license}):</strong> {sourceEntry.requiredNotice}
          </div>
        )}
      </div>
    </section>
  );
}
