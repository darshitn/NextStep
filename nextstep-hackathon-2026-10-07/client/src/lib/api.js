/**
 * NextStep Live API Client Adapter (Sankirth's Domain)
 * Conforms strictly to contracts/API-V1.md and START-HERE.md.
 * Reads Supabase auth token, handles timeouts, and normalizes error objects.
 */

import { supabaseAuth } from './supabase.js';

const WRITE_TIMEOUT_MS = 20000;
const READ_TIMEOUT_MS = 60000;

function getApiBaseUrl() {
  const rawBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').trim();
  // Strip trailing slashes
  const clean = rawBase.replace(/\/+$/, '');
  // Strip trailing /api if inadvertently included
  return clean.endsWith('/api') ? clean.slice(0, -4) : clean;
}

async function request(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}/api${normalizedEndpoint}`;

  const token = normalizedEndpoint.startsWith('/goal') ? await supabaseAuth.getValidAccessToken() : null;

  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  // Render can need a cold start. Only reads get the longer window; writes are
  // never retried automatically because their saved outcome may be unknown.
  const timeoutMs = (options.method || 'GET') === 'GET' ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error(options.method === 'GET' ? 'The server is taking longer to wake up. Please try loading your plan again.' : 'The request timed out. Reload your plan to check whether it saved before trying again.');
      timeoutError.status = 504;
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    const networkError = new Error('Could not connect to NextStep API server. Please check your connection.');
    networkError.status = 0;
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle safe JSON parsing
  let json;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    const errorInfo = json?.error || {};
    const message = errorInfo.message || `Request failed with status ${response.status} (${response.statusText})`;
    const code = errorInfo.code || (response.status === 401 ? 'UNAUTHORIZED' : 'HTTP_ERROR');

    const thrownError = new Error(message);
    thrownError.status = response.status;
    thrownError.code = code;
    if (errorInfo.fields) {
      thrownError.fields = errorInfo.fields;
    }
    throw thrownError;
  }

  return json;
}

export const liveApi = {
  // Auth methods delegated to Supabase Auth adapter
  async getCurrentUser() {
    return supabaseAuth.getCurrentUser();
  },

  async signIn(email, password) {
    return supabaseAuth.signIn(email, password);
  },

  async signUp(email, password, metadata) {
    return supabaseAuth.signUp(email, password, metadata);
  },

  checkAuthFromUrl() {
    return supabaseAuth.checkAuthFromUrl();
  },

  async signOut() {
    return supabaseAuth.signOut();
  },

  // Public endpoints
  async getHealth() {
    return request('/health', { method: 'GET' });
  },

  async getCatalog() {
    return request('/catalog', { method: 'GET' });
  },

  // Authenticated Goal endpoints
  async getGoal() {
    return request('/goal', { method: 'GET' });
  },

  async renameGoal(payload) {
    return request('/goal', { method: 'PATCH', body: payload });
  },

  async createGoal(payload) {
    return request('/goal', {
      method: 'POST',
      body: payload
    });
  },

  async completeMission(payload) {
    return request('/goal/complete', {
      method: 'POST',
      body: payload
    });
  },

  async previewRecovery(payload) {
    return request('/goal/recovery/preview', {
      method: 'POST',
      body: payload
    });
  },

  async applyRecovery(payload) {
    return request('/goal/recovery/apply', {
      method: 'POST',
      body: payload
    });
  },

  async getGuidance(payload) {
    return request('/goal/guidance', {
      method: 'POST',
      body: payload
    });
  },

  async saveLearningContext(payload) {
    return request('/goal/learning/context', {
      method: 'POST',
      body: payload
    });
  },

  async submitLearningCheck(payload) {
    return request('/goal/learning/check', {
      method: 'POST',
      body: payload
    });
  },

  async saveRecallAttempt(payload) {
    return request('/goal/learning/recall', {
      method: 'POST',
      body: payload
    });
  },

  async saveLessonProgress(payload) {
    return request('/goal/workspace/lesson', {
      method: 'POST',
      body: payload
    });
  },

  async saveExerciseAttempt(payload) {
    return request('/goal/workspace/exercise', {
      method: 'POST',
      body: payload
    });
  },

  async savePracticeAttempt(payload) {
    return request('/goal/workspace/practice', {
      method: 'POST',
      body: payload
    });
  },

  async previewWorkspacePlan(payload) {
    return request('/goal/workspace/plan/preview', {
      method: 'POST',
      body: payload
    });
  },

  async applyWorkspacePlan(payload) {
    return request('/goal/workspace/plan/apply', {
      method: 'POST',
      body: payload
    });
  },

  async evaluateTraceStep(payload) {
    return request('/catalog/exercise/evaluate-step', {
      method: 'POST',
      body: payload
    });
  },

  async evaluateEdgeCheck(payload) {
    return request('/catalog/exercise/evaluate-edge', {
      method: 'POST',
      body: payload
    });
  },

  async evaluateLessonCheck(payload) {
    return request('/catalog/lesson/evaluate-check', {
      method: 'POST',
      body: payload
    });
  },

  async getExerciseReference(exerciseId) {
    return request(`/catalog/exercise/${exerciseId}/reference`, {
      method: 'GET'
    });
  },

  async getCheckpoint(checkpointId) {
    return request(`/goal/workspace/checkpoint/${checkpointId}`, {
      method: 'GET'
    });
  },

  async saveCheckpointDraft(payload) {
    return request('/goal/workspace/checkpoint/draft', {
      method: 'POST',
      body: payload
    });
  },

  async evaluateCheckpoint(payload) {
    return request('/goal/workspace/checkpoint/evaluate', {
      method: 'POST',
      body: payload
    });
  },

  async skipCheckpoint(payload) {
    return request('/goal/workspace/checkpoint/skip', {
      method: 'POST',
      body: payload
    });
  },

  async resetCheckpoint(payload) {
    return request('/goal/workspace/checkpoint/reset', {
      method: 'POST',
      body: payload
    });
  },

  async previewContinuationPlan(payload) {
    return request('/goal/workspace/continuation/plan/preview', {
      method: 'POST',
      body: payload
    });
  },

  async applyContinuationPlan(payload) {
    return request('/goal/workspace/continuation/plan/apply', {
      method: 'POST',
      body: payload
    });
  },

  async startPracticeSession(payload) {
    return request('/goal/workspace/practice-session/start', {
      method: 'POST',
      body: payload
    });
  },

  async updatePracticeSession(payload) {
    return request('/goal/workspace/practice-session/update', {
      method: 'POST',
      body: payload
    });
  }
};
