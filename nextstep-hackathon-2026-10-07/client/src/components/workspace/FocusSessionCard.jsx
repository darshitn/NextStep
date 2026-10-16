import React from 'react';
import { Timer, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { formatTimerDisplay } from '../../services/workspace.js';

const PRESETS = [15, 25, 30];

export default function FocusSessionCard({
  timerState,
  remainingSeconds,
  onStart,
  onPause,
  onResume,
  onReset,
  onSelectPreset
}) {
  const isRunning = Boolean(timerState?.isRunning);
  const isCompleted = Boolean(timerState?.isCompleted);
  const isPaused = !isRunning && timerState?.pausedRemainingSeconds !== null && !isCompleted && timerState?.pausedRemainingSeconds !== timerState?.totalSeconds;
  const isFresh = !isRunning && !isPaused && !isCompleted;

  return (
    <div className="context-card focus-timer-card">
      <div className="context-card-header">
        <span className="context-card-title">
          <Timer size={16} aria-hidden="true" />
          <span>Focus timer</span>
        </span>

        {/* Preset duration buttons */}
        <div className="flex items-center gap-1" role="group" aria-label="Timer duration presets">
          {PRESETS.map((mins) => (
            <button
              key={mins}
              type="button"
              disabled={isRunning}
              aria-pressed={timerState?.presetMinutes === mins}
              aria-label={`${mins} minute focus session preset`}
              className={`text-xs px-2 py-1 rounded-md border font-semibold transition-colors ${
                timerState?.presetMinutes === mins
                  ? 'ui-bg-accent ui-text-inverse border-transparent'
                  : 'ui-bg-surface ui-text-muted border-border hover:ui-text-ink disabled:opacity-50'
              }`}
              onClick={() => onSelectPreset(mins)}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Main Countdown Display */}
      <div className="text-center py-2">
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono ui-text-ink select-none">
          {formatTimerDisplay(remainingSeconds)}
        </div>
        <p className="text-xs ui-text-muted mt-1">
          {isRunning ? 'Session in progress' : isPaused ? 'Paused' : isCompleted ? 'Completed' : `${timerState?.presetMinutes || 25} min focus block`}
        </p>
      </div>

      {/* Completion status announced only once */}
      {isCompleted && (
        <div role="status" aria-live="polite" className="status-badge status-success text-xs justify-center py-1.5 w-full">
          <CheckCircle2 size={14} aria-hidden="true" />
          <span>Focus session complete!</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex items-center gap-2 justify-center pt-1">
        {isFresh && (
          <button
            type="button"
            onClick={onStart}
            className="primary-button text-xs w-full py-2"
          >
            <Play size={14} aria-hidden="true" />
            <span>Start focus session</span>
          </button>
        )}

        {isRunning && (
          <>
            <button
              type="button"
              onClick={onPause}
              className="secondary-button text-xs flex-1 py-2"
              aria-label="Pause focus timer"
            >
              <Pause size={14} aria-hidden="true" />
              <span>Pause</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="secondary-button text-xs flex-1 py-2"
              aria-label="Reset focus timer"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              type="button"
              onClick={onResume}
              className="primary-button text-xs flex-1 py-2"
              aria-label="Resume focus timer"
            >
              <Play size={14} aria-hidden="true" />
              <span>Resume</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="secondary-button text-xs flex-1 py-2"
              aria-label="Reset focus timer"
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </>
        )}

        {isCompleted && (
          <button
            type="button"
            onClick={onReset}
            className="primary-button text-xs w-full py-2"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Start new session</span>
          </button>
        )}
      </div>

      <p className="text-[11px] ui-text-muted text-center leading-tight pt-1 border-t ui-border-border">
        Session-only timer · Resets on page reload · Does not complete missions or award XP.
      </p>
    </div>
  );
}
