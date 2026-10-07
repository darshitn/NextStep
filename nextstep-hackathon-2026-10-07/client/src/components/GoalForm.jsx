import React, { useState } from 'react';
import { Calendar, Target, Clock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import AvailabilityPicker from './AvailabilityPicker.jsx';

function getTodayStr() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(now);
}

function addDaysStr(str, days) {
  const d = new Date(str + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function GoalForm({ onSubmit, isLoading = false, error = null }) {
  const today = getTodayStr();
  const defaultTarget = addDaysStr(today, 30);

  const [goalName, setGoalName] = useState('Prepare for my first placement interview');
  const [planStartDate, setPlanStartDate] = useState(today);
  const [targetDate, setTargetDate] = useState(defaultTarget);
  const [deadlineMode, setDeadlineMode] = useState('flexible');
  const [availability, setAvailability] = useState({
    mon: 60,
    tue: 0,
    wed: 60,
    thu: 0,
    fri: 60,
    sat: 0,
    sun: 0
  });
  const [validationError, setValidationError] = useState(null);

  // Generate stable creationRequestId for idempotent retry
  const [creationRequestId] = useState(() => {
    return crypto.randomUUID();
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (targetDate < planStartDate) {
      setValidationError('Target completion date cannot be earlier than plan start date.');
      return;
    }
    const totalMins = Object.values(availability).reduce((sum, v) => sum + (Number(v) || 0), 0);
    if (totalMins === 0) {
      setValidationError('Please configure at least 30 minutes of study capacity in your weekly availability.');
      return;
    }
    setValidationError(null);

    onSubmit({
      creationRequestId,
      goalName: goalName.trim(),
      trackId: 'dsa-starter-v1',
      planStartDate,
      targetDate,
      deadlineMode,
      timezone: 'Asia/Kolkata',
      availability
    });
  };

  return (
    <div className="max-w-2xl w-full mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold ui-text-ink tracking-tight">
          A big goal. A doable next step.
        </h1>
        <p className="text-sm ui-text-muted">
          Name your goal, choose your time, and build a routine you can keep.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 shadow-glass space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="goal-name" className="block text-sm font-semibold ui-text-ink mb-2">What are you working toward?</label>
            <input id="goal-name" required maxLength={80} value={goalName} onChange={e => setGoalName(e.target.value)} pattern=".*\S.*" className="w-full rounded-xl ui-bg-surface border ui-border-border px-4 py-3 ui-text-ink" />
            <p className="text-xs ui-text-muted mt-2">Your goal name is personal. This MVP provides DSA Foundations missions; other learning tracks are not available yet.</p>
          </div>
          {/* Selected Track Banner */}
          <div className="p-4 rounded-xl ui-bg-surface-a90 border ui-border-border flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider ui-text-ink">Selected Track</span>
              <h3 className="font-bold text-sm ui-text-ink">DSA Foundations Starter (v1)</h3>
              <p className="text-xs ui-text-muted mt-0.5">12 structured 30-minute missions (6 hours total)</p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold ui-bg-soft-a20 ui-text-ink rounded-lg border ui-border-border-a30">
              360 mins
            </span>
          </div>

          {/* Date range grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 ui-text-ink" />
                Plan Start Date
              </label>
              <input
                type="date"
                required
                value={planStartDate}
                onChange={(e) => setPlanStartDate(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm ui-text-ink"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 ui-text-ink" />
                Target Deadline
              </label>
              <input
                type="date"
                required
                min={planStartDate}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm ui-text-ink"
              />
            </div>
          </div>

          {/* Deadline Mode Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider ui-text-ink block mb-2">
              Deadline Pacing Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  deadlineMode === 'flexible'
                    ? 'ui-bg-soft-a20 ui-border-border ui-text-ink shadow-sm ring-1 ring-brand-500/40'
                    : 'ui-bg-soft-a50 ui-border-border ui-text-ink hover:ui-bg-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Flexible Deadline (Recommended)</span>
                  <input
                    type="radio"
                    name="deadlineMode"
                    value="flexible"
                    checked={deadlineMode === 'flexible'}
                    onChange={() => setDeadlineMode('flexible')}
                    className="accent-brand-500"
                  />
                </div>
                <span className="text-[11px] ui-text-muted leading-tight">
                  Automatically extends target date when schedule recoveries occur.
                </span>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  deadlineMode === 'fixed'
                    ? 'ui-bg-soft-a20 ui-border-border ui-text-ink shadow-sm ring-1 ring-brand-500/40'
                    : 'ui-bg-soft-a50 ui-border-border ui-text-ink hover:ui-bg-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Fixed Deadline</span>
                  <input
                    type="radio"
                    name="deadlineMode"
                    value="fixed"
                    checked={deadlineMode === 'fixed'}
                    onChange={() => setDeadlineMode('fixed')}
                    className="accent-brand-500"
                  />
                </div>
                <span className="text-[11px] ui-text-muted leading-tight">
                  Strict calendar deadline; flags overflow workload if behind schedule.
                </span>
              </label>
            </div>
          </div>

          {/* Weekly Availability Picker */}
          <AvailabilityPicker
            value={availability}
            onChange={setAvailability}
            disabled={isLoading}
          />

          {(validationError || error) && (
            <p className="text-xs ui-text-ink font-medium">{validationError || error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl ui-bg-accent hover:ui-bg-accent ui-text-inverse font-semibold text-sm transition-all shadow-glow hover:shadow-lg disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isLoading ? 'Creating Deterministic Plan...' : 'Generate Practice Plan'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
