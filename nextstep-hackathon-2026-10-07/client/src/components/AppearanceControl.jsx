import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Target, Check } from 'lucide-react';
import { STYLES, getSavedStyle, applyStyle } from '../services/appearanceEngine.js';

const STYLE_ICONS = {
  'frosted-sage': Sparkles,
  'study-journal': BookOpen,
  'quiet-focus': Target
};

export default function AppearanceControl() {
  const [style, setStyle] = useState(() => {
    if (typeof document !== 'undefined' && document.documentElement.dataset.style) {
      const current = document.documentElement.dataset.style;
      if (STYLES.some(s => s.id === current)) return current;
    }
    return getSavedStyle();
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    applyStyle(style);
  }, [style]);

  const handleSelect = (newStyle) => {
    const updated = applyStyle(newStyle);
    setStyle(updated);
    setIsOpen(false);
  };

  const currentOption = STYLES.find(s => s.id === style) || STYLES[0];
  const CurrentIcon = STYLE_ICONS[currentOption.id] || Sparkles;

  return (
    <div className="relative inline-block text-left" role="region" aria-label="Appearance style selector">
      {/* Segmented bar for desktop (md+), compact dropdown on smaller screens */}
      <div className="hidden lg:inline-flex items-center gap-1 p-1 rounded-xl ui-bg-soft border ui-border-border" role="radiogroup" aria-label="Visual style">
        {STYLES.map((opt) => {
          const isSelected = style === opt.id;
          const Icon = STYLE_ICONS[opt.id] || Sparkles;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'ui-bg-surface ui-text-ink shadow-sm border ui-border-border font-semibold'
                  : 'ui-text-muted hover:ui-text-ink hover:ui-bg-surface-a80'
              }`}
              title={`${opt.label} — ${opt.hint}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile & tablet compact dropdown button */}
      <div className="lg:hidden relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Visual style: ${currentOption.label}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ui-bg-soft border ui-border-border text-xs font-medium ui-text-ink hover:ui-bg-surface transition-colors"
        >
          <CurrentIcon className="w-3.5 h-3.5 ui-text-ink" />
          <span className="truncate max-w-[85px]">{currentOption.label}</span>
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label="Select appearance style"
            className="absolute left-0 mt-1.5 w-44 rounded-xl ui-bg-surface border ui-border-border shadow-lg p-1.5 z-50 animate-fade-in"
          >
            {STYLES.map((opt) => {
              const isSelected = style === opt.id;
              const Icon = STYLE_ICONS[opt.id] || Sparkles;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'ui-bg-soft font-semibold ui-text-ink'
                      : 'ui-text-muted hover:ui-text-ink hover:ui-bg-soft-a50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 ui-text-ink" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
