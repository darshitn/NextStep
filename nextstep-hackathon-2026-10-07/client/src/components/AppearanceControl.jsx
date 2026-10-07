import React, { useEffect, useId, useRef, useState } from 'react';
import { Palette, Sparkles, BookOpen, Target, Check, ChevronDown } from 'lucide-react';
import { STYLES, getSavedStyle, applyStyle } from '../services/appearanceEngine.js';
import ThemeToggle from './ThemeToggle.jsx';

const ICONS = { 'frosted-sage': Sparkles, 'study-journal': BookOpen, 'quiet-focus': Target };
export default function AppearanceControl() {
  const [style, setStyle] = useState(() => document.documentElement.dataset.style || getSavedStyle());
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const scrollRef = useRef({ left: 0, top: 0 });
  const id = useId();
  const restoreScroll = () => requestAnimationFrame(() => window.scrollTo({ ...scrollRef.current, behavior: 'instant' }));
  const chooseStyle = next => {
    setStyle(applyStyle(next));
    // Font metrics can change in Study Journal. Keep the user's viewport stable.
    restoreScroll();
  };
  useEffect(() => { applyStyle(style); }, [style]);
  useEffect(() => {
    if (!isOpen) return;
    rootRef.current.querySelector('input:checked')?.focus({ preventScroll: true });
    const outside = event => { if (!rootRef.current?.contains(event.target)) setIsOpen(false); };
    const escape = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
        restoreScroll();
      }
    };
    document.addEventListener('pointerdown', outside);
    const root = rootRef.current;
    root.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); root.removeEventListener('keydown', escape); };
  }, [isOpen]);
  return <div ref={rootRef} className="appearance-control" onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
  }}>
    <button ref={triggerRef} type="button" className="appearance-trigger" aria-expanded={isOpen}
      aria-controls={id} onClick={() => {
        if (!isOpen) scrollRef.current = { left: window.scrollX, top: window.scrollY };
        else restoreScroll();
        setIsOpen(value => !value);
      }}>
      <Palette size={17} /><span>Appearance</span><ChevronDown size={14} />
    </button>
    {isOpen && <div id={id} className="appearance-popover" aria-label="Appearance preferences">
      <fieldset><legend>Visual style</legend>
        {STYLES.map(option => {
          const Icon = ICONS[option.id];
          return <label key={option.id} className="appearance-option">
            <input type="radio" name={`style-${id}`} value={option.id} checked={style === option.id}
              onChange={() => chooseStyle(option.id)} />
            <Icon size={18} aria-hidden="true" />
            <span><strong>{option.label}</strong><small>{option.hint}</small></span>
            {style === option.id && <Check size={16} aria-hidden="true" />}
          </label>;
        })}
      </fieldset>
      <div className="appearance-mode"><span>Color mode</span><ThemeToggle onChoose={restoreScroll} /></div>
    </div>}
  </div>;
}
