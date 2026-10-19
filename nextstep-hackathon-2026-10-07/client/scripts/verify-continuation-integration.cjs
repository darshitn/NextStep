// Local synthetic integration gate. No live auth, server keys or production data.
// node client/scripts/verify-continuation-integration.cjs [playwright path] [URL]
const assert = require('node:assert/strict');
const { chromium } = require(process.argv[2] || 'D:/Projects/Deadline-Catcher/node_modules/playwright');
const url = process.argv[3] || 'http://127.0.0.1:5173';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let passed = 0;
  async function scenario(name, mode, run) {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    try {
      await page.route('**/*', (route) => {
        const request = new URL(route.request().url());
        if (request.origin !== new URL(url).origin) return route.abort();
        if (request.pathname !== '/src/services/apiService.js') return route.continue();
        return route.fulfill({ contentType: 'application/javascript', body: `
          import { apiFixture, DEMO_ACCOUNTS, safeStorage } from '/src/fixtures/apiFixture.js';
          const mode = ${JSON.stringify(mode)};
          let first = true;
          window.continuationAudit = { submissions: [], saving: 0, saveErrors: [], injected: false };
          export const isFixtureMode = true;
          export const onSessionExpired = () => () => {};
          export const apiService = { ...apiFixture, demoAccounts: DEMO_ACCOUNTS,
            saveCheckpointDraft: async (payload) => {
              window.continuationAudit.saving++;
              try {
                const response = await apiFixture.saveCheckpointDraft(payload);
                if (mode === 'delay') { window.continuationAudit.injected = true; await new Promise(r => setTimeout(r, 600)); }
                return response;
              } catch (err) { window.continuationAudit.saveErrors.push(err.code); throw err; }
              finally { window.continuationAudit.saving--; }
            },
            evaluateCheckpoint: async (payload) => {
              window.continuationAudit.submissions.push(structuredClone(payload));
              if (first && mode === 'conflict') {
                first = false; window.continuationAudit.injected = true;
                const goal = (await apiFixture.getGoal()).data.goal;
                const user = await apiFixture.getCurrentUser();
                goal.version++; safeStorage.setItem('nextstep_fixture_goal_' + user.id, JSON.stringify(goal));
                throw { status: 409, code: 'VERSION_CONFLICT', message: 'Synthetic concurrent goal update' };
              }
              const response = await apiFixture.evaluateCheckpoint(payload);
              if (first && mode === 'drop') {
                first = false; window.continuationAudit.injected = true;
                throw { status: 503, code: 'NETWORK_ERROR', message: 'Synthetic dropped response after commit' };
              }
              return response;
            }
          };` });
      });
      await page.goto(url);
      await page.locator('input[type=email]').fill('student.completed@nextstep.local');
      await page.locator('input[type=password]').fill('password123');
      await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await page.locator('.workspace-nav').waitFor();
      assert.ok(await page.evaluate(() => Boolean(window.continuationAudit)), 'Fixture interceptor must actually run');
      await run(page);
      assert.deepEqual(errors, []);
      console.log(`PASS ${++passed}: ${name}`);
    } finally { await context.close(); }
  }
  async function checkpoint(page) {
    await page.getByRole('button', { name: /Check My Foundations/i }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('input[type=radio]').first().waitFor();
    return dialog;
  }
  const saved = (page) => page.waitForFunction(() => window.continuationAudit.saving === 0);
  async function reachLast(page, dialog) {
    for (let index = 0; index < 2; index++) {
      await dialog.locator('input[type=radio]').first().click(); await saved(page);
      await dialog.getByRole('button', { name: 'Next Question', exact: true }).click(); await saved(page);
    }
  }
  async function result(dialog) {
    await dialog.getByRole('button', { name: 'Retry Checkpoint', exact: true }).waitFor();
    assert.equal(await dialog.getByRole('alert').count(), 0);
  }
  try {
    await scenario('Due Proof review appears in editable plan candidates', 'normal', async (page) => {
      await page.evaluate(async () => {
        const { apiFixture, safeStorage } = await import('/src/fixtures/apiFixture.js');
        const goal = (await apiFixture.getGoal()).data.goal;
        const user = await apiFixture.getCurrentUser();
        goal.studyWorkspace.exerciseAttempts.ex_arrays_01 = [{ outcome: 'with_hint', savedAt: '2000-01-01T00:00:00Z', nextReviewDate: '2000-01-02' }];
        safeStorage.setItem('nextstep_fixture_goal_' + user.id, JSON.stringify(goal));
      });
      await page.reload();
      await page.getByRole('button', { name: /Choose My Next Step/i }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByText('Due Proof Review', { exact: true }).waitFor();
      assert.ok(await dialog.getByRole('checkbox').count() >= 2, 'Reviews must leave room for eligible new learning');
    });
    await scenario('Rapid choices preserve latest answer after reload', 'delay', async (page) => {
      let dialog = await checkpoint(page);
      await dialog.locator('input[type=radio]').nth(0).click();
      await dialog.locator('input[type=radio]').nth(1).click();
      await saved(page);
      assert.deepEqual(await page.evaluate(() => window.continuationAudit.saveErrors), []);
      assert.equal(await page.evaluate(() => window.continuationAudit.injected), true);
      await page.reload(); dialog = await checkpoint(page);
      assert.equal(await dialog.locator('input[type=radio]').nth(1).isChecked(), true);
    });
    await scenario('Immediate submit drains a committed but delayed draft response', 'delay', async (page) => {
      const dialog = await checkpoint(page); await reachLast(page, dialog);
      await dialog.locator('input[type=radio]').first().click();
      assert.ok(await page.evaluate(() => window.continuationAudit.saving > 0));
      await dialog.getByRole('button', { name: 'Submit Checkpoint', exact: true }).click();
      await result(dialog);
      assert.equal(await page.evaluate(() => window.continuationAudit.submissions.length), 1);
      assert.equal(await page.evaluate(() => window.continuationAudit.injected), true);
    });
    await scenario('Dropped response retry retains canonical submission', 'drop', async (page) => {
      const dialog = await checkpoint(page); await reachLast(page, dialog);
      await dialog.locator('input[type=radio]').first().click(); await saved(page);
      await dialog.locator('textarea').fill('Original finalized reflection');
      await dialog.getByRole('button', { name: 'Submit Checkpoint', exact: true }).click();
      await dialog.getByRole('alert').waitFor();
      await dialog.locator('textarea').fill('Edited after uncertain response');
      await dialog.getByRole('button', { name: 'Submit Checkpoint', exact: true }).click();
      await result(dialog);
      const audit = await page.evaluate(() => window.continuationAudit);
      assert.equal(audit.injected, true); assert.equal(audit.submissions.length, 2);
      assert.deepEqual(audit.submissions[0], audit.submissions[1]);
    });
    await scenario('Real version conflict refresh preserves local submission and recovers', 'conflict', async (page) => {
      const dialog = await checkpoint(page); await reachLast(page, dialog);
      await dialog.locator('input[type=radio]').first().click(); await saved(page);
      await dialog.locator('textarea').fill('Preserved after another tab changed the goal');
      await dialog.getByRole('button', { name: 'Submit Checkpoint', exact: true }).click();
      await dialog.getByRole('button', { name: 'Refresh workspace version', exact: true }).click();
      await dialog.getByRole('alert').waitFor({ state: 'hidden' });
      assert.equal(await dialog.locator('textarea').inputValue(), 'Preserved after another tab changed the goal');
      await dialog.getByRole('button', { name: 'Submit Checkpoint', exact: true }).click();
      await result(dialog);
      const audit = await page.evaluate(() => window.continuationAudit);
      assert.equal(audit.injected, true); assert.equal(audit.submissions.length, 2);
      const [first, second] = audit.submissions;
      assert.equal(second.expectedVersion, first.expectedVersion + 1);
      assert.deepEqual({ ...first, expectedVersion: second.expectedVersion }, second);
    });
    console.log(`Continuation integration: ${passed}/5 passed`);
  } finally { await browser.close(); }
})().catch((err) => { console.error(err); process.exitCode = 1; });
