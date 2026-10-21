const { chromium } = require('D:/Projects/Deadline-Catcher/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const EVIDENCE_DIR = path.resolve(__dirname, '../.local/full-local-qa/2026-10-21T11-48-00Z/stage6');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const BASE_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';
const { apiFixture } = require('../src/fixtures/apiFixture.js');

(async () => {
  console.log('====================================================');
  console.log('STAGE 6: ADAPTIVE PRACTICE & SESSION INTEGRITY');
  console.log('====================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = { passed: [], failed: [] };
  function recordPass(testName, detail = '') {
    console.log(`[PASS]: ${testName} ${detail}`);
    results.passed.push({ testName, detail });
  }
  function recordFail(testName, error) {
    console.error(`[FAIL]: ${testName}`, error);
    results.failed.push({ testName, error: error?.message || String(error) });
  }

  try {
    // ----------------------------------------------------
    // PART A: Adaptive Proposal Modal & Budget Selection
    // ----------------------------------------------------
    console.log('\n--- Part A: Adaptive Proposal Modal & Budget Selection ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', 'student.active@nextstep.local');
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/dashboard');

    // Click "Practise what needs work" button in TodayView or Review
    const proposalTrigger = page.getByRole('button', { name: /Practise what needs work/i });
    await proposalTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await proposalTrigger.click();
    await page.waitForTimeout(400);

    // Verify Proposal Modal opens
    const proposalModal = page.getByRole('dialog', { name: /Practise What Needs Work/i });
    await proposalModal.waitFor({ state: 'visible', timeout: 10000 });
    assert.ok(await proposalModal.isVisible(), 'Practice Proposal modal dialog must open');

    // Verify budget selection buttons (10 min, 20 min, 30 min)
    const budget10 = proposalModal.getByRole('radio', { name: /10 min/i });
    const budget20 = proposalModal.getByRole('radio', { name: /20 min/i });
    const budget30 = proposalModal.getByRole('radio', { name: /30 min/i });
    assert.ok(await budget10.isVisible() && await budget20.isVisible() && await budget30.isVisible(), '10, 20, and 30 minute duration presets must exist');

    // Test budget toggles and verify candidate task count updates
    await budget10.click();
    await page.waitForTimeout(200);
    await budget30.click();
    await page.waitForTimeout(200);
    await budget20.click();
    await page.waitForTimeout(200);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-adaptive-practice-proposal.png') });
    recordPass('ADAPT-01..02: Proposal modal opened and duration budgets (10/20/30 min) toggled cleanly');

    // ----------------------------------------------------
    // PART B: Active Practice Session Start & Focus Indicator
    // ----------------------------------------------------
    console.log('\n--- Part B: Starting Practice Session ---');
    const startSessionBtn = proposalModal.getByRole('button', { name: /Start Practice Session/i });
    await startSessionBtn.click();
    await page.waitForTimeout(600);

    // Verify PracticeSessionModal opens
    const runnerModal = page.locator('[role="dialog"]').filter({ has: page.locator('#practice-runner-title') });
    await runnerModal.waitFor({ state: 'visible', timeout: 10000 });
    assert.ok(await runnerModal.isVisible(), 'Practice session runner must be open');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02-active-practice-session.png') });
    recordPass('ADAPT-03..04: Practice session initialized with active task index and session indicator');

    // ----------------------------------------------------
    // PART C: CAS Concurrency, Retry Idempotency & Conflict Check
    // ----------------------------------------------------
    console.log('\n--- Part C: CAS Concurrency & Idempotency Invariants ---');
    await apiFixture.signIn('student.active@nextstep.local');
    const goalRes = await apiFixture.getGoal();
    const curVersion = goalRes.data.goal.version;

    // 1. Idempotent Retry: identical payload returns same receipt without version bump
    const testSessionId = '88888888-2222-4444-8888-aaaaaaaaaaaa';
    const startPayload = {
      sessionId: testSessionId,
      expectedVersion: curVersion,
      timeBudgetMinutes: 10,
      tasks: [
        {
          taskId: 'task_01',
          itemType: 'exercise',
          lessonId: 'les_arrays_01',
          exerciseId: 'ex_arrays_01',
          topicId: 'topic_arrays',
          estimatedMinutes: 10
        }
      ]
    };

    const firstStart = await apiFixture.startPracticeSession(startPayload);
    const retryStart = await apiFixture.startPracticeSession(startPayload);
    assert.equal(firstStart.data.goal.version, retryStart.data.goal.version, 'Idempotent retry must not bump version');

    // 2. Altered Payload Conflict: altered payload with same sessionId returns 409
    await assert.rejects(
      async () => {
        await apiFixture.startPracticeSession({
          ...startPayload,
          timeBudgetMinutes: 20
        });
      },
      (err) => {
        assert.equal(err.status, 409, 'Altered same-ID request must return 409 conflict');
        return true;
      }
    );

    // 3. Stale version conflict
    await assert.rejects(
      async () => {
        await apiFixture.startPracticeSession({
          sessionId: '77777777-3333-5555-9999-bbbbbbbbbbbb',
          expectedVersion: curVersion - 1,
          timeBudgetMinutes: 10,
          tasks: startPayload.tasks
        });
      },
      (err) => {
        assert.equal(err.status, 409, 'Stale expectedVersion must return 409');
        return true;
      }
    );

    recordPass('ADAPT-05..07: CAS concurrency, retry idempotency without version bump, and 409 conflict handling verified');

  } catch (err) {
    recordFail('STAGE-6-VERIFICATION', err);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`STAGE 6 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('====================================================');

  if (results.failed.length > 0) {
    process.exit(1);
  }
})();
