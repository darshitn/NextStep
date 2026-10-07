import React, { useState } from 'react';
import {
  createInitialTraceState,
  evaluatePrediction,
  resetTrace,
  PRIMARY_ARRAY,
  ALTERNATE_ARRAY
} from '../services/duplicateTraceEngine.js';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  Layers,
  ArrowDown
} from 'lucide-react';

export default function DuplicateTrace({ onProceedToCheck }) {
  const [selectedArrayType, setSelectedArrayType] = useState('primary'); // 'primary' | 'alternate'
  const currentArray = selectedArrayType === 'primary' ? PRIMARY_ARRAY : ALTERNATE_ARRAY;
  const [traceState, setTraceState] = useState(() => createInitialTraceState(currentArray));

  const handlePredict = (predictSeen) => {
    const { state } = evaluatePrediction(traceState, predictSeen);
    setTraceState(state);
  };

  const handleReset = () => {
    setTraceState(resetTrace(currentArray));
  };

  const handleToggleArray = (type) => {
    setSelectedArrayType(type);
    const arr = type === 'primary' ? PRIMARY_ARRAY : ALTERNATE_ARRAY;
    setTraceState(resetTrace(arr));
  };

  const currentValue = traceState.status !== 'completed'
    ? traceState.array[traceState.currentIndex]
    : traceState.duplicateValue;

  return (
    <div
      aria-label="Interactive Duplicate Check Trace"
      className="rounded-2xl border ui-border-border ui-bg-surface p-4 sm:p-5 my-4 space-y-4 shadow-sm animate-fade-in"
    >
      {/* Exercise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ui-border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg ui-bg-accent ui-text-inverse flex items-center justify-center font-bold text-xs shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold ui-text-ink flex items-center gap-1.5">
              <span>Interactive Step-by-Step Duplicate Trace</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full ui-bg-soft ui-text-ink font-semibold border ui-border-border">
                Mission M04 Practice
              </span>
            </h4>
            <p className="text-[11px] ui-text-muted">
              Learn the core principle: <strong className="ui-text-ink font-semibold">check before insert</strong>.
            </p>
          </div>
        </div>

        {/* Array switcher & Restart */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleToggleArray('primary')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedArrayType === 'primary'
                ? 'ui-bg-soft border-2 ui-border-border ui-text-ink'
                : 'ui-bg-surface border ui-border-border ui-text-muted hover:ui-text-ink'
            }`}
            aria-pressed={selectedArrayType === 'primary'}
          >
            [2, 5, 2]
          </button>
          <button
            type="button"
            onClick={() => handleToggleArray('alternate')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              selectedArrayType === 'alternate'
                ? 'ui-bg-soft border-2 ui-border-border ui-text-ink'
                : 'ui-bg-surface border ui-border-border ui-text-muted hover:ui-text-ink'
            }`}
            aria-pressed={selectedArrayType === 'alternate'}
          >
            Retry [4, 1, 4]
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg ui-bg-surface hover:ui-bg-soft border ui-border-border ui-text-muted hover:ui-text-ink transition-colors"
            title="Restart exercise from beginning"
            aria-label="Restart exercise from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Array Cells */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider ui-text-muted block">
          Array under inspection:
        </span>
        <div className="flex items-center gap-2.5 overflow-x-auto py-1">
          {traceState.array.map((val, idx) => {
            const isInspecting = traceState.status === 'predicting' && traceState.currentIndex === idx;
            const isDuplicate = traceState.status === 'completed' && traceState.duplicateIndex === idx;
            const isProcessed = idx < traceState.currentIndex && !isDuplicate;

            return (
              <div
                key={idx}
                className={`relative flex flex-col items-center justify-center min-w-[56px] h-16 rounded-xl border font-mono font-bold transition-all ${
                  isDuplicate
                    ? 'border-2 border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 scale-105 shadow-sm'
                    : isInspecting
                    ? 'border-2 ui-border-border ui-bg-soft text-base ui-text-ink ring-2 ring-slate-400/30 scale-105 shadow-sm'
                    : isProcessed
                    ? 'border ui-border-border ui-bg-surface-a80 text-xs ui-text-muted opacity-80'
                    : 'border ui-border-border ui-bg-surface text-xs ui-text-muted opacity-60'
                }`}
              >
                <span className="text-sm sm:text-base">{val}</span>
                <span className="text-[10px] font-sans font-normal opacity-75">
                  i = {idx}
                </span>

                {isInspecting && (
                  <span className="absolute -top-2.5 px-1.5 py-0.2 rounded bg-slate-900 text-white dark:bg-white dark:text-black text-[9px] font-sans font-bold shadow-xs">
                    Current
                  </span>
                )}
                {isDuplicate && (
                  <span className="absolute -top-2.5 px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[9px] font-sans font-bold shadow-xs">
                    Duplicate!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Seen Set Display */}
      <div className="p-3 rounded-xl ui-bg-soft border ui-border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-semibold ui-text-ink">Current Set (seen values): </span>
          <span className="font-mono font-semibold ui-text-ink">
            {traceState.seenSet.length > 0 ? `{ ${traceState.seenSet.join(', ')} }` : 'Ø (empty set)'}
          </span>
        </div>
        <span className="text-[11px] ui-text-muted italic">
          Size: {traceState.seenSet.length} unique items
        </span>
      </div>

      {/* Interactive Question or Completion State */}
      {traceState.status === 'predicting' ? (
        <div className="space-y-3 pt-1">
          <div className="rounded-xl border ui-border-border p-3.5 space-y-2 ui-bg-surface">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 ui-text-ink shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold ui-text-ink">
                  Step {traceState.currentIndex + 1}: Inspecting index {traceState.currentIndex} (value = {currentValue})
                </p>
                <p className="text-xs ui-text-muted">
                  Before adding {currentValue} to the set: <strong className="ui-text-ink">Has {currentValue} already been seen in the set?</strong>
                </p>
              </div>
            </div>

            {/* Prediction Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handlePredict(false)}
                className="w-full text-left p-3 rounded-xl border ui-border-border ui-bg-surface hover:ui-bg-soft transition-all text-xs group focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <span className="font-bold ui-text-ink block mb-0.5">
                  No, not seen yet
                </span>
                <span className="text-[11px] ui-text-muted block font-mono">
                  set.has({currentValue}) === false
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePredict(true)}
                className="w-full text-left p-3 rounded-xl border ui-border-border ui-bg-surface hover:ui-bg-soft transition-all text-xs group focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <span className="font-bold ui-text-ink block mb-0.5">
                  Yes, already seen
                </span>
                <span className="text-[11px] ui-text-muted block font-mono">
                  set.has({currentValue}) === true
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Completed Duplicate Detected Banner */
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-2.5 animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h5 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
              Duplicate Found at Index {traceState.duplicateIndex}!
            </h5>
          </div>

          <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed">
            At index {traceState.duplicateIndex}, the value is <strong className="font-mono">{traceState.duplicateValue}</strong>.
            Immediately before this step, the set already held <strong className="font-mono">{`{ ${traceState.seenSet.join(', ')} }`}</strong>.
            Because <strong className="font-mono">{`set.has(${traceState.duplicateValue})`}</strong> returned true, the algorithm stops and identifies the duplicate!
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-500/20">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleArray(selectedArrayType === 'primary' ? 'alternate' : 'primary')}
                className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-white/50 dark:bg-black/20 text-emerald-900 dark:text-emerald-100 font-semibold hover:bg-emerald-500/10 transition-colors"
              >
                {selectedArrayType === 'primary' ? 'Try alternate array [4, 1, 4]' : 'Switch back to [2, 5, 2]'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-900 dark:text-emerald-100 font-semibold hover:bg-emerald-500/10 transition-colors"
              >
                Restart trace
              </button>
            </div>

            {onProceedToCheck && (
              <button
                type="button"
                onClick={onProceedToCheck}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl ui-bg-accent ui-text-inverse font-semibold hover:opacity-90 shadow-sm transition-all"
              >
                <span>Proceed to Curated Reasoning Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Feedback Banner */}
      {traceState.lastFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 animate-fade-in ${
            traceState.lastFeedback.type === 'correct'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
          }`}
        >
          {traceState.lastFeedback.type === 'correct' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-semibold block">{traceState.lastFeedback.message}</span>
            <span className="block opacity-90">{traceState.lastFeedback.explanation}</span>
          </div>
        </div>
      )}

      {/* Key Architectural Reminder */}
      <div className="pt-2 border-t ui-border-border flex items-center justify-between text-[11px] ui-text-muted italic">
        <span>Why check before insert? Inserting before checking makes set.has(x) always true.</span>
        <span>Transient practice state; does not modify XP or schedule.</span>
      </div>
    </div>
  );
}
