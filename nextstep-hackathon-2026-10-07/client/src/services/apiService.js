// Unified Client API Service
// Connects client UI to liveApi adapter in client/src/lib/api.js.
// Strictly uses real Supabase authentication; never runs fixture mode in production.

import { liveApi } from '../lib/api.js';

// Rule: In production build, never silently or explicitly run in fixture mode.
export const isFixtureMode = false;

if (import.meta.env.PROD && isFixtureMode) {
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
    try {
      return await liveApi.signIn(email, password);
    } catch (err) {
      return handleApiError(err);
    }
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
  }
};
