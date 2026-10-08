import test from 'node:test';
import assert from 'node:assert/strict';
import { completedMinutesOnDate, calculateSchedule, deriveGoalStats } from '../src/services/scheduler.js';
import { generateGeminiGuidance, assessUnderstandingAnswer, buildGuidancePrompt } from '../src/services/guidance.js';
import { catalogData } from '../src/routes/catalog.js';
const output = { mode: 'guided_practice', explanation: 'Trace your example first.', steps: ['Write the array.', 'Check each index.'], checkQuestion: 'Which index is first?' };
const mission = catalogData.missions[0];

test('recovery capacity counts IST completions across UTC midnight', () => {
  const completions = { m01: { completedAt: '2026-10-07T19:00:00Z' }, m02: { completedAt: '2026-10-07T17:00:00Z' } };
  const consumed = completedMinutesOnDate(completions, '2026-10-08');
  assert.equal(consumed, 30);
  const schedule = calculateSchedule('2026-10-08', { thu: 30, fri: 30 }, ['m03'], consumed);
  assert.equal(schedule[0].date, '2026-10-09');
});
test('completed plan finish date uses the actual IST completion date', () => {
  const stats = deriveGoalStats({ completions: { m01: { completedAt: '2026-10-07T19:00:00Z' } }, schedule: [], targetDate: '2026-11-01' }, { missions: [mission] });
  assert.equal(stats.estimatedFinishDate, '2026-10-08');
});
test('Gemini receives the actual catalogue steps and completion criteria', () => {
  const prompt = JSON.parse(buildGuidancePrompt({ mission, category: 'too_difficult', whereStuck: 'I need a starting point.' }));
  assert.deepEqual(prompt.mission.steps, mission.steps);
  assert.equal(prompt.mission.completionCriteria, mission.doneWhen);
  assert.equal(prompt.studentContext.whereStuck, 'I need a starting point.');
});
test('invalid AI output retries once and returns only independently validated advice', async () => {
  let calls = 0;
  const clientOverride = { models: { generateContent: async request => {
    calls++; assert.equal(request.config.responseSchema.properties.steps.maxItems, '4');
    return { text: calls === 1 ? 'null' : JSON.stringify(output) };
  } } };
  assert.deepEqual(await generateGeminiGuidance({ mission, category: 'too_difficult', clientOverride }), output);
  assert.equal(calls, 2);
});
test('whole JSON fences are accepted while invalid output never becomes fallback guidance', async () => {
  let calls = 0;
  const clientOverride = { models: { generateContent: async () => { calls++; return { text: '```json\n' + JSON.stringify(output) + '\n```' }; } } };
  assert.deepEqual(await generateGeminiGuidance({ mission, category: 'too_difficult', clientOverride }), output);
  assert.equal(calls, 1);
  clientOverride.models.generateContent = async () => { calls++; return { text: JSON.stringify({ ...output, explanation: 'x'.repeat(401) }) }; };
  await assert.rejects(generateGeminiGuidance({ mission, category: 'too_difficult', clientOverride }), e => e.code === 'INVALID_AI_OUTPUT');
  assert.equal(calls, 3);
});
test('provider outage is not automatically retried or mislabeled as AI success', async () => {
  let calls = 0;
  const clientOverride = { models: { generateContent: async () => { calls++; throw new Error('provider unavailable'); } } };
  await assert.rejects(generateGeminiGuidance({ mission, category: 'too_difficult', clientOverride }), e => e.status === 503);
  assert.equal(calls, 1);
});
test('reasoning assessment uses the same bounded validation retry', async () => {
  let calls = 0; const assessed = { status: 'needs_another_try', explanation: 'Explain the comparison.', nextStep: 'Trace one index.' };
  const clientOverride = { models: { generateContent: async () => ({ text: ++calls === 1 ? '[]' : JSON.stringify(assessed) }) } };
  assert.deepEqual(await assessUnderstandingAnswer({ mission, questionId: 'test', questionText: 'Why?', rubric: 'Explain', answer: 'Test answer', clientOverride }), assessed);
  assert.equal(calls, 2);
});

test('invalid-output retry shares one deadline and aborts pending AI work', async () => {
  let calls = 0; let signal;
  const clientOverride = { models: { generateContent: async request => {
    signal = request.config.abortSignal;
    if (++calls === 1) return { text: 'null' };
    return new Promise(() => {});
  } } };
  await assert.rejects(generateGeminiGuidance({ mission, category: 'too_difficult', clientOverride, timeoutMs: 30 }), e => e.code === 'AI_TIMEOUT' && e.status === 504);
  assert.equal(calls, 2);
  assert.equal(signal.aborted, true);
});
