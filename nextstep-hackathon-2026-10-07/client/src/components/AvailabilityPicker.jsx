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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-400" />
            Weekly Study Availability
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Set discrete daily capacity (30m blocks). 0m designates scheduled rest.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-100 border border-slate-700/60 text-xs font-medium text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
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
                  ? 'bg-surface-100/90 border-brand-500/30 shadow-sm'
                  : 'bg-surface-200/50 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs tracking-wider uppercase text-slate-300">
                  {label}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    dayVal > 0
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'bg-slate-800 text-slate-500'
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
                          ? 'bg-brand-600 text-white shadow-sm ring-1 ring-brand-400'
                          : 'bg-surface-300/80 text-slate-400 hover:text-slate-200 hover:bg-surface-50'
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
        <p className="text-xs text-rose-400 font-medium">
          * At least one day must have at least 30 minutes of study capacity.
        </p>
      )}
    </div>
  );
}
