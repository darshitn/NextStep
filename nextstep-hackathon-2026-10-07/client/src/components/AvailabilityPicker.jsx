import React from 'react';
import { Clock, Calendar } from 'lucide-react';

const DAYS = [
  { key: 'mon', label: 'Mon', full: 'Monday' },
  { key: 'tue', label: 'Tue', full: 'Tuesday' },
  { key: 'wed', label: 'Wed', full: 'Wednesday' },
  { key: 'thu', label: 'Thu', full: 'Thursday' },
  { key: 'fri', label: 'Fri', full: 'Friday' },
  { key: 'sat', label: 'Sat', full: 'Saturday' },
  { key: 'sun', label: 'Sun', full: 'Sunday' },
];

const TICKS = [
  { value: 0, label: 'Rest' },
  { value: 30, label: '30m' },
  { value: 60, label: '60m' },
  { value: 90, label: '90m' },
];

export default function AvailabilityPicker({ value, onChange, disabled = false }) {
  const current = value || { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };

  const handleSliderChange = (dayKey, minutes) => {
    if (disabled) return;
    const clamped = Math.max(0, Math.min(90, Math.round(minutes / 30) * 30));
    onChange({
      ...current,
      [dayKey]: clamped
    });
  };

  const applyPreset = (minutesPerWeekday) => {
    if (disabled) return;
    onChange({
      mon: minutesPerWeekday,
      tue: minutesPerWeekday,
      wed: minutesPerWeekday,
      thu: minutesPerWeekday,
      fri: minutesPerWeekday,
      sat: 0,
      sun: 0
    });
  };

  const totalMinutes = Object.values(current).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const isZeroValid = totalMinutes > 0;

  return (
    <div className="availability-picker space-y-4">
      <div className="availability-heading flex flex-wrap items-start justify-between gap-3 pb-3 border-b ui-border-border">
        <div>
          <label className="text-sm font-semibold ui-text-ink flex items-center gap-1.5">
            <Calendar className="w-4 h-4 ui-text-ink" />
            Weekly Study Availability
          </label>
          <p className="text-xs ui-text-muted mt-0.5">
            Adjust daily focus time in 30-minute intervals. 0 minutes is a rest day.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ui-bg-surface border ui-border-border text-xs font-medium ui-text-ink whitespace-nowrap shrink-0">
            <Clock className="w-3.5 h-3.5 ui-text-ink" />
            {totalHours} hrs / wk
          </span>
        </div>
      </div>

      {/* Explicit Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs ui-text-muted font-medium">Quick presets:</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyPreset(30)}
          className="text-xs px-2.5 py-1 rounded-lg border ui-border-border ui-bg-surface hover:ui-bg-soft ui-text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Weekdays · 30 min/day
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyPreset(60)}
          className="text-xs px-2.5 py-1 rounded-lg border ui-border-border ui-bg-surface hover:ui-bg-soft ui-text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Weekdays · 60 min/day
        </button>
      </div>

      <div className="availability-days">
        {DAYS.map(({ key, full }) => {
          const dayVal = current[key] ?? 0;
          const pct = Math.round((dayVal / 90) * 100);
          return (
            <div
              key={key}
              className={`availability-day rounded-xl border transition-colors ${
                dayVal > 0
                  ? 'ui-bg-surface-a90 ui-border-border-a30 shadow-sm'
                  : 'ui-bg-soft-a50 ui-border-border'
              }`}
            >
              <div className="availability-day-heading">
                <span className="font-semibold text-xs tracking-wider uppercase ui-text-ink">
                  {full}
                </span>
                <span
                  className={`availability-day-value text-xs font-semibold px-2.5 py-1 rounded-full ${
                    dayVal > 0
                      ? 'ui-bg-accent/15 ui-text-accent'
                      : 'ui-bg-soft ui-text-muted'
                  }`}
                >
                  {dayVal === 0 ? 'Rest' : `${dayVal} min`}
                </span>
              </div>

              {/* Native Range Slider */}
              <div className="availability-day-controls">
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="30"
                  value={dayVal}
                  disabled={disabled}
                  onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                  aria-label={`${full} study time`}
                  aria-valuetext={dayVal === 0 ? 'Rest day' : `${dayVal} minutes`}
                  aria-valuenow={dayVal}
                  className="availability-slider"
                  style={{ '--slider-pct': `${pct}%` }}
                />

                {/* Tick Labels */}
                <div className="availability-ticks ui-text-muted">
                  {TICKS.map(({ value: tickVal, label: tickLabel }) => (
                    <button
                      type="button"
                      key={tickVal}
                      disabled={disabled}
                      onClick={() => handleSliderChange(key, tickVal)}
                      className={`availability-tick cursor-pointer hover:ui-text-ink transition-colors ${
                        dayVal === tickVal ? 'font-bold ui-text-accent' : ''
                      }`}
                      aria-pressed={dayVal === tickVal}
                      aria-label={`${full}: ${tickVal} minutes`}
                    >
                      {tickLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isZeroValid && (
        <p className="text-xs ui-text-ink font-medium" role="alert">
          * At least one day must have at least 30 minutes of study capacity.
        </p>
      )}
    </div>
  );
}
