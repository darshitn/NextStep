// Unified Client API Service (Darshit's domain)
// Integrates with fixture adapter during development, and delegates to Sankirth's
// live client/src/lib/api.js once delivered.

import { apiFixture, DEMO_ACCOUNTS } from '../fixtures/apiFixture.js';

// Detect whether we are in fixture mode
// Rule: In production build, never silently enter fixture mode.
export const isFixtureMode = true; // Set to false once Sankirth delivers client/src/lib/api.js and client/src/lib/supabase.js

if (import.meta.env.PROD && isFixtureMode) {
  console.warn('[NextStep] Running with fixture mode active. Live API adapter not yet wired.');
}

export const apiService = {
  isFixtureMode,
  demoAccounts: DEMO_ACCOUNTS,

  async getCurrentUser() {
    return apiFixture.getCurrentUser();
  },

  async signIn(email, password) {
    return apiFixture.signIn(email, password);
  },

  async signOut() {
    return apiFixture.signOut();
  },

  async getHealth() {
    return apiFixture.getHealth();
  },

  async getCatalog() {
    return apiFixture.getCatalog();
  },

  async getGoal() {
    return apiFixture.getGoal();
  },

  async createGoal(payload) {
    return apiFixture.createGoal(payload);
  },

  async completeMission(payload) {
    return apiFixture.completeMission(payload);
  },

  async previewRecovery(payload) {
    return apiFixture.previewRecovery(payload);
  },

  async applyRecovery(payload) {
    return apiFixture.applyRecovery(payload);
  },

  async getGuidance(payload) {
    return apiFixture.getGuidance(payload);
  }
};
