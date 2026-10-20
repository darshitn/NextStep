import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

export const CONFIDENCE_OPTIONS = [
  { value: 'ready', label: 'Ready to apply it' },
  { value: 'needs_example', label: 'I need another example' },
  { value: 'unsure', label: "I'm still unsure" }
];

export const FOCUS_OPTIONS = [
  { value: 'invariant', label: 'The invariant / tracked state' },
  { value: 'update_order', label: 'Pointer or update order' },
  { value: 'edge_cases', label: 'Boundary / edge cases' },
  { value: 'none', label: 'No particular blocker' }
];

export default function ReflectionCheckIn({
  checkIn,
  onChangeCheckIn,
  reflection = '',
  onChangeReflection,
  promptText,
  textareaId,
  placeholder = 'Write a takeaway in your own words...',
  disabled = false
}) {
  const [isOpen, setIsOpen] = React.useState(Boolean(reflection));

  React.useEffect(() => {
    if (reflection) {
      setIsOpen(true);
    }
  }, [reflection]);

  const confidence = checkIn?.confidence || null;
  const focus = checkIn?.focus || null;

  const navigateChoice = (event, options, index, field) => {
    if (disabled) return;
    let nextIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % options.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index + options.length - 1) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else return;
    event.preventDefault();
    onChangeCheckIn({ ...checkIn, version: 1, [field]: options[nextIndex].value });
    event.currentTarget.parentElement.querySelectorAll('[role="radio"]')[nextIndex].focus();
  };

  const handleSelectConfidence = (val) => {
    if (disabled) return;
    onChangeCheckIn({
      ...checkIn,
      version: 1,
      confidence: confidence === val ? undefined : val
    });
  };

  const handleSelectFocus = (val) => {
    if (disabled) return;
    onChangeCheckIn({
      ...checkIn,
      version: 1,
      focus: focus === val ? undefined : val
    });
  };

  return (
    <div className="reflection-checkin space-y-3.5">
      {/* Question 1: How did this feel? */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold ui-text-ink">
          How did this feel?
        </label>
        <div
          role="radiogroup"
          aria-label="How did this feel?"
          className="grid grid-cols-1 sm:grid-cols-3 gap-2"
        >
          {CONFIDENCE_OPTIONS.map((opt, index) => {
            const isSelected = confidence === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                disabled={disabled}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected || (!confidence && index === 0) ? 0 : -1}
                onKeyDown={(event) => navigateChoice(event, CONFIDENCE_OPTIONS, index, 'confidence')}
                onClick={() => handleSelectConfidence(opt.value)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${
                  isSelected
                    ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.08)] text-[rgb(var(--ink))] ring-1 ring-[rgb(var(--accent))] font-semibold'
                    : 'ui-border-border ui-bg-surface hover:ui-bg-soft ui-text-ink'
                }`}
              >
                <span className="text-xs">{opt.label}</span>
                {isSelected && <CheckCircle2 size={13} className="shrink-0 text-[rgb(var(--accent))]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question 2: What needs another look? */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold ui-text-ink">
          What needs another look?
        </label>
        <div
          role="radiogroup"
          aria-label="What needs another look?"
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {FOCUS_OPTIONS.map((opt, index) => {
            const isSelected = focus === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                disabled={disabled}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected || (!focus && index === 0) ? 0 : -1}
                onKeyDown={(event) => navigateChoice(event, FOCUS_OPTIONS, index, 'focus')}
                onClick={() => handleSelectFocus(opt.value)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[rgb(var(--accent))] ${
                  isSelected
                    ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.08)] text-[rgb(var(--ink))] ring-1 ring-[rgb(var(--accent))] font-semibold'
                    : 'ui-border-border ui-bg-surface hover:ui-bg-soft ui-text-ink'
                }`}
              >
                <span className="text-xs">{opt.label}</span>
                {isSelected && <CheckCircle2 size={13} className="shrink-0 text-[rgb(var(--accent))]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional written note disclosure */}
      <details
        className="group pt-1"
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
      >
        <summary className="text-xs font-medium ui-text-muted hover:ui-text-ink cursor-pointer inline-flex items-center gap-1.5 select-none">
          <FileText size={12} />
          <span>{reflection ? 'Edit written note' : 'Add a note (optional)'}</span>
        </summary>
        <div className="pt-2 space-y-1.5">
          {promptText && (
            <div className="text-xs ui-text-muted">
              {promptText}
            </div>
          )}
          <textarea
            id={textareaId}
            aria-label="Written reflection (optional)"
            rows={2}
            maxLength={500}
            disabled={disabled}
            value={reflection}
            onChange={(e) => onChangeReflection(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border ui-border-border ui-bg-surface p-2.5 text-xs ui-text-ink"
          />
        </div>
      </details>
    </div>
  );
}
