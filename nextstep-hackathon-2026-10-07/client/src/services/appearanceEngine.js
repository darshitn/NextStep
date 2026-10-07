export const STYLES = [
  {
    id: 'frosted-sage',
    label: 'Frosted Sage',
    hint: 'Sage & teal accents'
  },
  {
    id: 'study-journal',
    label: 'Study Journal',
    hint: 'Editorial serif & warm paper'
  },
  {
    id: 'quiet-focus',
    label: 'Quiet Focus',
    hint: 'Minimal chrome & lavender'
  }
];

export function getSavedStyle() {
  if (typeof window === 'undefined') return 'frosted-sage';
  try {
    const saved = localStorage.getItem('nextstep-style');
    if (STYLES.some(s => s.id === saved)) return saved;
  } catch {
    // Storage access is optional
  }
  return 'frosted-sage';
}

export function applyStyle(styleId) {
  const valid = STYLES.some(s => s.id === styleId) ? styleId : 'frosted-sage';
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.style = valid;
  }
  try {
    localStorage.setItem('nextstep-style', valid);
  } catch {
    // Storage access is optional
  }
  return valid;
}
