import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
export default function ThemeToggle({ onChoose }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  function choose(next) {
    const { scrollX: left, scrollY: top } = window;
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem('nextstep-theme', next); } catch { /* Storage is optional. */ }
    requestAnimationFrame(() => window.scrollTo({ left, top, behavior: 'instant' }));
    onChoose?.();
  }
  return <div className="theme-switch" role="group" aria-label="Color theme">
    <button type="button" aria-label="Light theme" aria-pressed={theme === 'light'} onClick={() => choose('light')}><Sun size={15} /><span>Light</span></button>
    <button type="button" aria-label="Dark theme" aria-pressed={theme === 'dark'} onClick={() => choose('dark')}><Moon size={15} /><span>Dark</span></button>
  </div>;
}
