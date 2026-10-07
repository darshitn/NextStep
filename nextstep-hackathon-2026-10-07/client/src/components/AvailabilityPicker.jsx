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

const OPTIONS = [
  { value: 0, label: '0 min', tag: 'Rest' },
  { value: 30, label: '30 min', tag: '1 mission' },
  { value: 60, label: '60 min', tag: '2 missions' },
  { value: 90, label: '90 min', tag: '3 missions' },
];

export default function AvailabilityPicker({ value, onChange, disabled = false }) {
  const current = value || { mon: 60, tue: 0, wed: 60, thu: 0, fri: 60, sat: 0, sun: 0 };

  const handleSelect = (dayKey, minutes) => {
    if (disabled) return;
    onChange({
      ...current,
      [dayKey]: minutes
    });
  };

  const totalMinutes = Object.values(current).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const weeklyMissions = Math.floor(totalMinutes / 30);
  const isZeroValid = totalMinutes > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b ui-border-border">
        <div>
          <label className="text-sm font-semibold ui-text-ink flex items-center gap-1.5">
            <Calendar className="w-4 h-4 ui-text-ink" />
            Weekly Study Availability
          </label>
          <p className="text-xs ui-text-muted mt-0.5">
            Set discrete daily capacity (30m blocks). 0m designates scheduled rest.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ui-bg-surface border ui-border-border text-xs font-medium ui-text-ink">
            <Clock className="w-3.5 h-3.5 ui-text-ink" />
            {totalHours} hrs / wk ({weeklyMissions} missions)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        {DAYS.map(({ key, label, full }) => {
          const dayVal = current[key] ?? 0;
          return (
            <div
              key={key}
              className={`p-3 rounded-xl border transition-all ${
                dayVal > 0
                  ? 'ui-bg-surface-a90 ui-border-border-a30 shadow-sm'
                  : 'ui-bg-soft-a50 ui-border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs tracking-wider uppercase ui-text-ink">
                  {label}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    dayVal > 0
                      ? 'ui-bg-soft-a20 ui-text-ink'
                      : 'ui-bg-soft ui-text-muted'
                  }`}
                >
                  {dayVal === 0 ? 'Rest' : `${dayVal}m`}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {OPTIONS.map(({ value: optVal }) => {
                  const isSelected = dayVal === optVal;
                  return (
                    <button
                      type="button"
                      key={optVal}
                      disabled={disabled}
                      onClick={() => handleSelect(key, optVal)}
                      className={`py-1.5 text-[11px] font-medium rounded transition-all ${
                        isSelected
                          ? 'ui-bg-accent ui-text-inverse shadow-sm ring-1 ring-brand-400'
                          : 'ui-bg-soft-a80 ui-text-muted hover:ui-text-ink hover:ui-bg-soft'
                      }`}
                      title={`${full}: ${optVal} min`}
                    >
                      {optVal === 0 ? '0' : `${optVal}`}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!isZeroValid && (
        <p className="text-xs ui-text-ink font-medium">
          * At least one day must have at least 30 minutes of study capacity.
        </p>
      )}
    </div>
  );
}
