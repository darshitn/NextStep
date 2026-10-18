// Unified Client API Service
// Connects client UI to liveApi adapter in client/src/lib/api.js.
// Strictly uses real Supabase authentication; never runs fixture mode in production.

import { liveApi } from '../lib/api.js';

// Rule: In production build, never silently or explicitly run in fixture mode.
export const isFixtureMode = false;

if (import.meta.env?.PROD && isFixtureMode) {
  throw new Error('[NextStep] Fatal: Fixture mode is strictly forbidden in production builds.');
}

let sessionExpiredListeners = [];

export function onSessionExpired(callback) {
  sessionExpiredListeners.push(callback);
  return () => {
    sessionExpiredListeners = sessionExpiredListeners.filter(cb => cb !== callback);
  };
}

function handleApiError(err) {
  if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
    sessionExpiredListeners.forEach(cb => cb(err));
  }
  // Re-throw so callers receive the exact error without fallback to fixtures
  throw err;
}

export const apiService = {
  isFixtureMode,
  demoAccounts: [], // Demo accounts removed from live mode

  async getCurrentUser() {
    try {
      return await liveApi.getCurrentUser();
    } catch (err) {
      return handleApiError(err);
    }
  },

  async signIn(email, password) {
    return liveApi.signIn(email, password);
  },

  async signUp(email, password, metadata) {
    return liveApi.signUp(email, password, metadata);
  },

  checkAuthFromUrl() {
    return liveApi.checkAuthFromUrl();
  },

  async signOut() {
    return liveApi.signOut();
  },

  async getHealth() {
    try {
      return await liveApi.getHealth();
    } catch (err) {
      return handleApiError(err);
    }
  },

  async getCatalog() {
    try {
      return await liveApi.getCatalog();
    } catch (err) {
      return handleApiError(err);
    }
  },

  async getGoal() {
    try {
      return await liveApi.getGoal();
    } catch (err) {
      return handleApiError(err);
    }
  },

  async renameGoal(payload) {
    try { return await liveApi.renameGoal(payload); } catch (err) { return handleApiError(err); }
  },

  async createGoal(payload) {
    try {
      return await liveApi.createGoal(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async completeMission(payload) {
    try {
      return await liveApi.completeMission(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async previewRecovery(payload) {
    try {
      return await liveApi.previewRecovery(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async applyRecovery(payload) {
    try {
      return await liveApi.applyRecovery(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async getGuidance(payload) {
    try {
      return await liveApi.getGuidance(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async saveLearningContext(payload) {
    try {
      return await liveApi.saveLearningContext(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async submitLearningCheck(payload) {
    try {
      return await liveApi.submitLearningCheck(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async saveRecallAttempt(payload) {
    try {
      return await liveApi.saveRecallAttempt(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async saveLessonProgress(payload) {
    try {
      return await liveApi.saveLessonProgress(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async saveExerciseAttempt(payload) {
    try {
      return await liveApi.saveExerciseAttempt(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async savePracticeAttempt(payload) {
    try {
      return await liveApi.savePracticeAttempt(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async previewWorkspacePlan(payload) {
    try {
      return await liveApi.previewWorkspacePlan(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async applyWorkspacePlan(payload) {
    try {
      return await liveApi.applyWorkspacePlan(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async evaluateTraceStep(payload) {
    try {
      return await liveApi.evaluateTraceStep(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async evaluateEdgeCheck(payload) {
    try {
      return await liveApi.evaluateEdgeCheck(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async evaluateLessonCheck(payload) {
    try {
      return await liveApi.evaluateLessonCheck(payload);
    } catch (err) {
      return handleApiError(err);
    }
  },

  async getExerciseReference(exerciseId) {
    try {
      return await liveApi.getExerciseReference(exerciseId);
    } catch (err) {
      return handleApiError(err);
    }
  }
};
