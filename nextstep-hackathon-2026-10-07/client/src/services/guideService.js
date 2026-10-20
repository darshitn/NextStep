import {
  Sparkles,
  Calendar,
  TrendingUp
} from 'lucide-react';

export const GUIDE_CHAPTERS = [
  {
    id: 'start_learning',
    title: 'Start learning',
    icon: Sparkles,
    steps: [
      {
        targetSelector: '[data-guide="today-activity-card"]',
        view: 'today',
        title: 'Start today’s activity',
        content: 'NextStep gives you one clear starting point. Here you see your recommended activity, estimated duration, and a plain-language explanation of why it was chosen.',
        actionLabel: 'Next: Open lesson'
      },
      {
        targetSelector: '[data-guide="today-primary-action-btn"]',
        view: 'today',
        title: 'Open the recommended lesson',
        content: 'Click the primary action button to enter the lesson workspace. The guide will meet you there to explain worked examples and interactive trace prediction.',
        actionLabel: 'Next: Worked example'
      },
      {
        targetSelector: '[data-guide="proof-learn-tab"]',
        view: 'proof',
        mode: 'learn',
        title: 'Understand the concept',
        content: 'Read the invariant mechanics and inspect the worked example. When you are ready, switch to Try to trace the algorithm with real inputs.',
        actionLabel: 'Next: Trace prediction'
      },
      {
        targetSelector: '[data-guide="proof-try-container"]',
        view: 'proof',
        mode: 'trace',
        title: 'Try the trace & see feedback',
        content: 'Select your prediction for each execution step. NextStep evaluates your answer immediately so you know where you stand without revealing answer keys.',
        actionLabel: 'Next: Saving & Finish'
      },
      {
        targetSelector: '[data-guide="proof-save-section"]',
        view: 'proof',
        mode: 'trace',
        title: 'Saving vs. Lesson completion',
        content: 'Saving records your verified trace attempt in your study records. Then complete the Lesson Invariant Check to mark the lesson finished and unlock the next activity.',
        actionLabel: 'Finish walkthrough'
      }
    ]
  },
  {
    id: 'plan_week',
    title: 'Plan my week',
    icon: Calendar,
    steps: [
      {
        targetSelector: '[data-guide="nav-week"]',
        view: 'today',
        title: 'My week overview',
        content: 'My week lets you see your scheduled study sessions and daily study capacity. Your starter track pace stays separate and protected.',
        actionLabel: 'Next: Planner actions'
      },
      {
        targetSelector: '[data-guide="week-plan-actions"]',
        view: 'week',
        title: 'Build your study week',
        content: 'You can adjust your daily time slots and select curriculum activities. Prerequisites are topologically ordered automatically before any practice problem.',
        actionLabel: 'Next: Daily schedule'
      },
      {
        targetSelector: '[data-guide="week-days-container"]',
        view: 'week',
        title: 'Your 7-day execution plan',
        content: 'Each day card shows scheduled sessions and committed time. Start any activity directly from its day card, and replan whenever your week changes.',
        actionLabel: 'Finish chapter'
      }
    ]
  },
  {
    id: 'understand_progress',
    title: 'Understand my progress',
    icon: TrendingUp,
    steps: [
      {
        targetSelector: '[data-guide="nav-atlas"]',
        view: 'today',
        title: 'Learning path map',
        content: 'The Learning path displays all 12 curriculum topics, prerequisite dependencies, verified Proof traces, and practice problems.',
        actionLabel: 'Next: Review queue'
      },
      {
        targetSelector: '[data-guide="nav-review"]',
        view: 'today',
        title: 'Practice notes & Spaced review',
        content: 'When you note difficulties, ask for AI guidance, or complete problems with hints, items are queued for spaced review based on your actual history.',
        actionLabel: 'Next: Progress record'
      },
      {
        targetSelector: '[data-guide="nav-insights"]',
        view: 'today',
        title: 'Progress summary & Export',
        content: 'Track active study days, level progression, and export your sanitized study record as JSON at any time without credentials.',
        actionLabel: 'Finish walkthrough'
      }
    ]
  }
];

export function getGuideStorageKey(user) {
  const identifier = user?.id || user?.email || 'anonymous';
  return `nextstep_guide_pref_v1_${identifier}`;
}

// Account-scoped in-memory preference fallback when localStorage is restricted or throws
const inMemoryGuidePrefs = new Map();

export function _resetInMemoryGuidePrefsForTest() {
  inMemoryGuidePrefs.clear();
}

export function normalizeGuidePreferences(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      version: 1,
      dismissedInvitation: false,
      completedChapters: []
    };
  }
  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    dismissedInvitation: Boolean(raw.dismissedInvitation),
    completedChapters: Array.isArray(raw.completedChapters)
      ? raw.completedChapters.filter((id) => typeof id === 'string')
      : []
  };
}

export function loadGuidePreferences(user) {
  const key = getGuideStorageKey(user);
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = normalizeGuidePreferences(parsed);
        inMemoryGuidePrefs.set(key, normalized);
        return normalized;
      }
    }
  } catch (err) {
    // Fall back to in-memory store when localStorage throws (e.g. SecurityError in iframe)
  }

  if (inMemoryGuidePrefs.has(key)) {
    return normalizeGuidePreferences(inMemoryGuidePrefs.get(key));
  }

  return {
    version: 1,
    dismissedInvitation: false,
    completedChapters: []
  };
}

export function saveGuidePreferences(user, prefs) {
  const key = getGuideStorageKey(user);
  const normalized = normalizeGuidePreferences(prefs);

  // Always keep in-memory cache synchronized
  inMemoryGuidePrefs.set(key, normalized);

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(normalized));
    }
  } catch (err) {
    // Graceful fallback to in-memory store
  }
}
