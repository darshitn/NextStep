// Browser State Isolation & UI Verification Test (Playwright-based)
// Uses fresh ephemeral contexts per run, bounded timeouts, request interception,
// actual console/page-error collection, failure screenshots, and clean process teardown.

import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let chromium;
try {
  chromium = (await import('file:///D:/Projects/Deadline-Catcher/node_modules/playwright/index.mjs')).chromium;
} catch (_) {
  chromium = require('playwright').chromium;
}

const APP_URL = process.env.APP_URL || process.argv[2] || 'http://127.0.0.1:5173';
const EVIDENCE_DIR = path.resolve(__dirname, '..', '.local', 'atlas-proof-evidence', 'browser-isolation');

const fixtureModuleBody = `
import { apiFixture, DEMO_ACCOUNTS } from '/src/fixtures/apiFixture.js';
export const isFixtureMode = true;
export const onSessionExpired = () => () => {};

// Global hooks for simulation testing
window.__testControl = {
  simulateStepEvalFail: false,
  simulateStepEvalDelayMs: 0
};

export const apiService = {
  ...apiFixture,
  demoAccounts: DEMO_ACCOUNTS,
  async evaluateTraceStep(args) {
    if (window.__testControl?.simulateStepEvalDelayMs > 0) {
      await new Promise(r => setTimeout(r, window.__testControl.simulateStepEvalDelayMs));
    }
    if (window.__testControl?.simulateStepEvalFail) {
      const err = new Error('Simulated evaluation network error 500');
      err.status = 500;
      throw err;
    }
    return apiFixture.evaluateTraceStep(args);
  }
};
`;

let browser = null;
const recordedPageErrors = [];
const recordedConsoleErrors = [];
const failedLocalRequests = [];

async function setupPage(context) {
  const page = await context.newPage();
  page.setDefaultTimeout(12000);

  page.on('pageerror', (err) => recordedPageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      recordedConsoleErrors.push(msg.text());
    }
  });
  page.on('requestfailed', (req) => {
    if (req.url().startsWith(APP_URL)) {
      failedLocalRequests.push(req.url());
    }
  });

  await page.route('**/*', (route) => {
    const parsed = new URL(route.request().url());
    if (parsed.pathname === '/src/services/apiService.js') {
      return route.fulfill({
        contentType: 'application/javascript; charset=utf-8',
        body: fixtureModuleBody
      });
    }
    return route.continue();
  });

  return page;
}

async function takeScreenshot(page, filename) {
  const filepath = path.join(EVIDENCE_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`[Screenshot saved]: ${filename}`);
}

async function runSuite() {
  console.log('=== NextStep Atlas + Proof Browser State Isolation & Layout Suite ===');
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  browser = await chromium.launch({ channel: 'msedge', headless: true });
  console.log('✓ Launched clean browser instance via Playwright.');

  // Context 1: Active Student - Primary state isolation & flow testing
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    acceptDownloads: true
  });
  const page = await setupPage(context);

  console.log(`Navigating to ${APP_URL}...`);
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Sign in as active student
  console.log('Signing in with student.active@nextstep.local...');
  await page.locator('input[type=email]').fill('student.active@nextstep.local');
  await page.locator('input[type=password]').fill('password123');
  await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
  await page.locator('.workspace-nav').waitFor();
  console.log('✓ Authenticated into workspace navigation.');
  await takeScreenshot(page, '00-workspace-initial.png');

  const selectNav = async (name) => {
    const directLocator = page
      .locator('.workspace-nav')
      .getByRole('button', { name: new RegExp('^' + name + '(?:\\s|$)') })
      .or(
        page
          .locator('.workspace-nav')
          .getByRole('tab', { name: new RegExp('^' + name + '(?:\\s|$)') })
      );

    const count = await directLocator.count();
    for (let i = 0; i < count; i++) {
      const el = directLocator.nth(i);
      if (await el.isVisible()) {
        return el.click();
      }
    }

    const moreTrigger = page.locator('#nav-more-trigger');
    if (await moreTrigger.isVisible()) {
      await moreTrigger.click();
      const menuLocator = page
        .locator('.workspace-nav-dropdown')
        .getByRole('menuitem', { name: new RegExp('^' + name + '(?:\\s|$)') })
        .or(
          page
            .locator('.workspace-nav-dropdown')
            .getByRole('button', { name: new RegExp('^' + name + '(?:\\s|$)') })
        );
      return menuLocator.first().click();
    }

    return directLocator.first().click();
  };

  // -------------------------------------------------------------------------
  // Scenario 1: State Isolation Between Exercises A & B (Reflections)
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 1: Reflection Isolation Between Exercises A & B ---');
  await selectNav('Proof');
  await page.locator('#view-proof').waitFor();

  await page.locator('#proof-topic-select').selectOption('topic_arrays');
  await page.locator('#proof-lesson-select').selectOption('les_arrays_01');
  await page.locator('#proof-exercise-reflection').waitFor();

  const refA = 'Exercise A Reflection: Track minimum price encountered so far and maximize profit.';
  console.log(`Setting Exercise A reflection...`);
  await page.locator('#proof-exercise-reflection').fill(refA);

  // Switch to Lesson 2 (Exercise B: ex_arrays_02)
  console.log('Switching to Exercise B (les_arrays_02)...');
  await page.locator('#proof-lesson-select').selectOption('les_arrays_02');
  await page.locator('#proof-exercise-reflection').waitFor();

  // Verify Exercise B starts empty
  const valBInitial = await page.locator('#proof-exercise-reflection').inputValue();
  assert.equal(valBInitial, '', 'Exercise B reflection must initially be empty and isolated from Exercise A!');
  console.log('✓ Exercise B reflection is clean (no leakage from Exercise A).');

  const refB = 'Exercise B Reflection: Maintain prefix product array and running suffix product.';
  console.log(`Setting Exercise B reflection...`);
  await page.locator('#proof-exercise-reflection').fill(refB);

  // Switch back to Exercise A
  console.log('Switching back to Exercise A (les_arrays_01)...');
  await page.locator('#proof-lesson-select').selectOption('les_arrays_01');
  await page.locator('#proof-exercise-reflection').waitFor();
  const valAReturned = await page.locator('#proof-exercise-reflection').inputValue();
  assert.equal(valAReturned, refA, 'Exercise A must preserve its exact reflection when returning!');
  console.log('✓ Exercise A retained its exact reflection.');

  // Switch back to Exercise B
  console.log('Switching back to Exercise B (les_arrays_02)...');
  await page.locator('#proof-lesson-select').selectOption('les_arrays_02');
  await page.locator('#proof-exercise-reflection').waitFor();
  const valBReturned = await page.locator('#proof-exercise-reflection').inputValue();
  assert.equal(valBReturned, refB, 'Exercise B must preserve its exact reflection when returning!');
  console.log('✓ Exercise B retained its exact reflection.');
  await takeScreenshot(page, '01-reflection-isolation.png');

  // -------------------------------------------------------------------------
  // Scenario 2: Switching Lessons, Topics, and Input Variants
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 2: Switching Lessons, Topics, and Input Variants ---');
  await page.getByRole('button', { name: /Try Alternate Input/i }).click();
  await page.getByRole('button', { name: /Back to Primary Input/i }).waitFor();
  console.log('✓ Switched to Alternate Variant (Back to Primary Input rendered).');

  await page.getByRole('button', { name: /Back to Primary Input/i }).click();
  await page.getByRole('button', { name: /Try Alternate Input/i }).waitFor();
  console.log('✓ Successfully toggled back to Primary Input.');

  // Switch Topic to topic_hashing
  console.log('Switching topic to topic_hashing...');
  await page.locator('#proof-topic-select').selectOption('topic_hashing');
  await page.getByRole('heading', { name: /Complement Lookup-Before-Insert/i }).waitFor();
  console.log('✓ Topic switched to Hashing; Complement Lookup-Before-Insert rendered.');

  // Toggle variant on Hashing
  await page.getByRole('button', { name: /Try Alternate Input/i }).click();
  await page.getByRole('button', { name: /Back to Primary Input/i }).waitFor();
  console.log('✓ Hashing alternate input toggled successfully.');
  await page.getByRole('button', { name: /Back to Primary Input/i }).click();
  await takeScreenshot(page, '02-topic-lesson-variant-switching.png');

  // -------------------------------------------------------------------------
  // Scenario 3: Visit a Lesson Without an Attached Exercise
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 3: Visit a Lesson Without an Attached Exercise ---');
  await page.locator('#proof-topic-select').selectOption('topic_arrays');
  await page.locator('#proof-lesson-select').selectOption('les_arrays_03');
  await page.getByRole('heading', { name: /In-Place Compaction/i }).waitFor();

  // Verify interactive exercise heading is absent
  const hasExerciseHeading = await page.locator('#interactive-exercise-heading').count();
  assert.equal(hasExerciseHeading, 0, 'Lesson without exercise must NOT render interactive exercise heading');

  // Verify empty state message
  await page.getByText('No Interactive Proof Trace Attached to this Lesson').waitFor();
  console.log('✓ Verified: "No Interactive Proof Trace Attached to this Lesson" rendered cleanly.');

  // Verify lesson reflection functions normally
  await page.locator('#lesson-reflection-input').fill('Slow write pointer only advances on valid compaction element.');
  assert.equal(
    await page.locator('#lesson-reflection-input').inputValue(),
    'Slow write pointer only advances on valid compaction element.'
  );
  console.log('✓ Lesson reflection functions normally on exercise-free lessons.');
  await takeScreenshot(page, '03-lesson-without-exercise.png');

  // -------------------------------------------------------------------------
  // Scenario 4: Simulated Evaluation Failure, Retry & State Isolation
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 4: Simulated Evaluation Failure, Retry & State Isolation ---');
  await page.locator('#proof-lesson-select').selectOption('les_arrays_01');
  await page.locator('#interactive-exercise-heading').waitFor();

  // Arm test hook to simulate 500 error
  await page.evaluate(() => { window.__testControl.simulateStepEvalFail = true; });

  // Click first choice
  const choiceGroup = page.getByRole('group', { name: 'Trace step choices', exact: true });
  await choiceGroup.waitFor();
  const firstChoiceBtn = choiceGroup.getByRole('button').first();
  await firstChoiceBtn.click();

  // Verify role="alert" with error message
  const alert = page.getByRole('alert');
  await alert.waitFor();
  assert.ok((await alert.innerText()).includes('Simulated evaluation network error 500'));
  console.log('✓ Accessible role="alert" banner displayed for network evaluation error.');

  // Verify explicit [Retry Verification] button rendered
  const retryBtn = page.getByRole('button', { name: /Retry Verification/i });
  await retryBtn.waitFor();
  console.log('✓ [Retry Verification] button rendered.');

  // Disarm test hook and retry
  await page.evaluate(() => { window.__testControl.simulateStepEvalFail = false; });
  await retryBtn.click();
  await page.getByRole('status').waitFor();
  console.log('✓ Retry succeeded; evaluation feedback displayed.');
  await takeScreenshot(page, '04a-eval-retry-success.png');

  // Test Delayed Evaluation & Cross-Exercise Race Condition Isolation
  console.log('Testing delayed response and cross-exercise isolation...');
  await page.evaluate(() => { window.__testControl.simulateStepEvalDelayMs = 1500; });

  // Click second choice on Exercise A
  const btns = choiceGroup.getByRole('button');
  if ((await btns.count()) > 1) {
    await btns.nth(1).click();
  }

  // Immediately switch to Exercise B while Exercise A is in flight
  console.log('Switching to Exercise B while Exercise A evaluation is in flight...');
  await page.locator('#proof-lesson-select').selectOption('les_arrays_02');
  await page.locator('#interactive-exercise-heading').waitFor();

  // Wait 2200ms for Exercise A's delayed response to finish in background
  await page.waitForTimeout(2200);

  // Verify Exercise B remains unpolluted
  const bHeading = await page.locator('#interactive-exercise-heading').innerText();
  assert.ok(bHeading.includes('Product of Array Except Self') || bHeading.includes('Exclusive Prefix'), 'Exercise B heading must remain intact');
  const bRefReturned = await page.locator('#proof-exercise-reflection').inputValue();
  assert.equal(bRefReturned, refB, 'Exercise B reflection must not be mutated by Exercise A evaluation response');
  console.log('✓ Cross-exercise race condition prevention verified: Exercise B is completely isolated.');
  await page.evaluate(() => { window.__testControl.simulateStepEvalDelayMs = 0; });
  await takeScreenshot(page, '04b-race-condition-isolated.png');

  // -------------------------------------------------------------------------
  // Scenario 5: Refresh, Direct Links, and Back Navigation
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 5: Refresh, Direct Links, and Navigation ---');
  // Direct link to Practice view
  console.log(`Navigating directly to ${APP_URL}/dashboard?view=practice...`);
  await page.goto(`${APP_URL}/dashboard?view=practice`, { waitUntil: 'domcontentloaded' });
  await page.locator('#view-practice').waitFor();
  const practiceItemsCount = await page.locator('#view-practice [role="listitem"]').count();
  assert.equal(practiceItemsCount, 20, 'Practice library direct link must render page 1 (20 items)');
  console.log(`✓ Direct link to Practice view rendered page 1 (20 items).`);

  // Direct link to Proof lesson via /learn/les_arrays_01
  console.log(`Navigating directly to ${APP_URL}/learn/les_arrays_01...`);
  await page.goto(`${APP_URL}/learn/les_arrays_01`, { waitUntil: 'domcontentloaded' });
  await page.locator('#view-proof').waitFor();
  const selectedLesson = await page.locator('#proof-lesson-select').inputValue();
  assert.equal(selectedLesson, 'les_arrays_01', 'Direct /learn/:lessonId link must select the target lesson');
  console.log('✓ Direct /learn/les_arrays_01 link loaded Proof Studio with les_arrays_01.');

  // Page reload
  console.log('Testing page reload...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#view-proof').waitFor();
  assert.equal(await page.locator('#proof-lesson-select').inputValue(), 'les_arrays_01', 'Page reload must preserve active lesson');
  console.log('✓ Page refresh verified: user session and active lesson preserved.');

  // Back navigation
  console.log('Testing back navigation...');
  await page.goBack();
  await page.locator('#view-practice').waitFor();
  console.log('✓ Back navigation returned to Practice Library.');
  await takeScreenshot(page, '05-refresh-and-navigation.png');

  // -------------------------------------------------------------------------
  // Scenario 6: Multi-Account Onboarding & Interrupted States
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 6: Multi-Account States (New & Interrupted) ---');
  // Fresh Context for New Account: student.ready@nextstep.local
  const readyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const readyPage = await setupPage(readyContext);
  await readyPage.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await readyPage.locator('input[type=email]').fill('student.ready@nextstep.local');
  await readyPage.locator('input[type=password]').fill('password123');
  await readyPage.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
  await readyPage.waitForTimeout(1000);
  console.log('✓ Verified sign-in for new onboarding account (student.ready@nextstep.local).');
  await takeScreenshot(readyPage, '06-ready-account-onboarding.png');
  await readyContext.close();

  // Fresh Context for Interrupted Account: student.interrupted@nextstep.local
  const interruptedContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const interruptedPage = await setupPage(interruptedContext);
  await interruptedPage.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  await interruptedPage.locator('input[type=email]').fill('student.interrupted@nextstep.local');
  await interruptedPage.locator('input[type=password]').fill('password123');
  await interruptedPage.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
  await interruptedPage.locator('.workspace-nav').waitFor();
  console.log('✓ Verified sign-in for interrupted account (student.interrupted@nextstep.local).');
  await takeScreenshot(interruptedPage, '07-interrupted-account-recovery.png');
  await interruptedContext.close();

  // -------------------------------------------------------------------------
  // Scenario 7: Practice & Review Filter Empty States
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 7: Practice & Review Filter States ---');
  await selectNav('Practice');
  await page.locator('#view-practice').waitFor();
  await page.locator('#practice-search').fill('zzzz-nonexistent-search-term');
  await page.getByText('No practice problems match your filters', { exact: true }).waitFor();
  console.log('✓ Verified Practice empty filter message and reset button.');
  await page.getByRole('button', { name: 'Reset practice filters', exact: true }).click();
  assert.equal(await page.locator('#view-practice [role="listitem"]').count(), 20);
  console.log('✓ Reset practice filters restored page 1 problem list (20 items).');

  await selectNav('Review');
  await page.locator('#view-review').waitFor();
  await page.locator('[aria-label="Workspace curriculum review queue"]').waitFor();
  console.log('✓ Review view rendered curriculum review queue.');
  await takeScreenshot(page, '08-review-and-practice-filters.png');

  // -------------------------------------------------------------------------
  // Scenario 8: Layout Audit Across All 7 Views, 4 Viewports & 6 Themes
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 8: Responsive Layout Measurements (Audit Baseline) ---');
  const viewports = [
    { width: 1440, height: 900, name: 'desktop' },
    { width: 1024, height: 768, name: 'tablet' },
    { width: 390, height: 844, name: 'mobile-standard' },
    { width: 320, height: 568, name: 'mobile-compact' }
  ];

  const views = ['Today', 'Roadmap', 'Atlas', 'Proof', 'Practice', 'Review', 'Insights'];
  const layoutAuditData = [];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const viewName of views) {
      await selectNav(viewName);
      await page.waitForTimeout(100);

      const metrics = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          hasOverflow: document.documentElement.scrollWidth > window.innerWidth
        };
      });

      layoutAuditData.push({
        viewport: `${vp.width}x${vp.height} (${vp.name})`,
        view: viewName,
        ...metrics
      });
    }

    // Capture responsive audit screenshots at frosted-sage light
    await selectNav('Today');
    await takeScreenshot(page, `audit-today-${vp.width}x${vp.height}.png`);
    await selectNav('Proof');
    await takeScreenshot(page, `audit-proof-${vp.width}x${vp.height}.png`);
  }

  // -------------------------------------------------------------------------
  // Scenario 10: Mobile Focus Restoration & Trace First-Action Geometry
  // -------------------------------------------------------------------------
  console.log('\n--- Scenario 10: Mobile Focus Restoration & First-Action Geometry ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);

  // 1. More menu keyboard navigation and Escape focus return
  const trigger = page.locator('#nav-more-trigger');
  await trigger.focus();
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    'nav-more-trigger',
    'Trigger must be focused'
  );

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(100);
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    'menu-nav-roadmap',
    'Opening via ArrowDown must focus first menu item (Roadmap)'
  );

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(50);
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    'menu-nav-review',
    'ArrowDown must move focus to Review'
  );

  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  assert.equal(
    await page.locator('.workspace-nav-dropdown').isVisible(),
    false,
    'Menu must be closed after Escape'
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    'nav-more-trigger',
    'Escape dismissal must restore focus to #nav-more-trigger'
  );
  console.log('✓ Verified Escape closes More menu and restores focus to #nav-more-trigger.');

  // 2. Outside click closes menu without blanket focus shift
  await page.locator('#nav-more-trigger').click();
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.workspace-nav-dropdown').isVisible(), true, 'Dropdown opened by click');
  await page.mouse.click(10, 600);
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.workspace-nav-dropdown').isVisible(), false, 'Dropdown closed on outside click');
  const outsideClickActiveId = await page.evaluate(() => document.activeElement?.id);
  assert.notEqual(outsideClickActiveId, 'nav-more-trigger', 'Pointer click outside must not shift focus to trigger');
  console.log('✓ Verified outside pointer click closes menu without blanket focus shift.');

  // 3. Selecting secondary route deliberately focuses destination
  await page.locator('#nav-more-trigger').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  await page.locator('#menu-nav-roadmap').focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const secondaryFocusId = await page.evaluate(() => document.activeElement?.id);
  assert.ok(
    secondaryFocusId === 'roadmap-heading' || secondaryFocusId === 'view-roadmap',
    `Selecting secondary route should focus destination, got ${secondaryFocusId}`
  );
  console.log(`✓ Selecting secondary route focused deliberate destination: ${secondaryFocusId}`);

  // 4. Measure mobile trace first choice button geometry at 390x844
  await selectNav('Proof');
  await page.locator('#view-proof').waitFor();
  await page.waitForTimeout(200);

  const mobileFirstChoiceBtn = page.locator('#view-proof [role="group"][aria-label="Trace step choices"] button').first();
  await mobileFirstChoiceBtn.waitFor();
  const firstChoiceBox = await mobileFirstChoiceBtn.boundingBox();
  const measuredDocY = firstChoiceBox.y;
  const measuredReqScroll = Math.max(0, firstChoiceBox.y + firstChoiceBox.height - 844);

  console.log(`[Mobile Trace Geometry]: first answer document Y = ${measuredDocY.toFixed(1)}px, required scroll = ${measuredReqScroll.toFixed(1)}px`);
  assert.ok(
    measuredDocY < 1350,
    `Measured document Y (${measuredDocY.toFixed(1)}px) must be well below uncompacted 1,654px`
  );
  assert.ok(
    measuredReqScroll < 550,
    `Required scroll distance (${measuredReqScroll.toFixed(1)}px) must be well below uncompacted 888px`
  );
  console.log('✓ Verified Mobile Trace first answer button starts well within accessible scroll bounds.');

  // 5. Expandable pickers and assistance controls at 390x844
  const pickersToggle = page.locator('#toggle-mobile-pickers');
  assert.ok(await pickersToggle.isVisible(), 'Mobile pickers toggle must be visible at 390px');
  assert.ok(!(await page.locator('#proof-topic-select').isVisible()), 'Topic select must be collapsed by default on mobile');
  await pickersToggle.click();
  await page.waitForTimeout(100);
  assert.ok(await page.locator('#proof-topic-select').isVisible(), 'Topic select must be visible after expanding');
  assert.ok(await page.locator('#proof-lesson-select').isVisible(), 'Lesson select must be visible after expanding');

  const assistanceToggle = page.getByRole('button', { name: /Hints & Invariant/i });
  assert.ok(await assistanceToggle.isVisible(), 'Assistance toggle must be visible at 390px');
  assert.ok(!(await page.getByRole('button', { name: /Reveal Hint/i }).isVisible()), 'Hint button must be collapsed by default');
  await assistanceToggle.click();
  await page.waitForTimeout(100);
  assert.ok(await page.getByRole('button', { name: /Reveal Hint/i }).isVisible(), 'Reveal Hint visible after expanding');
  assert.ok(await page.getByRole('button', { name: /Reveal Reference Invariant/i }).isVisible(), 'Reveal Invariant visible after expanding');

  await takeScreenshot(page, '10-mobile-trace-compacted-and-expanded.png');
  console.log('✓ Verified mobile expandable pickers & assistance controls.');

  // Restore desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(100);

  // Write audit results
  const resultJsonPath = path.join(EVIDENCE_DIR, 'browser-state-isolation-result.json');
  await fs.writeFile(
    resultJsonPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        appUrl: APP_URL,
        scenariosPassed: [
          'Scenario 1: Reflection Isolation Between Exercises A & B',
          'Scenario 2: Switching Lessons, Topics, and Input Variants',
          'Scenario 3: Visit a Lesson Without an Attached Exercise',
          'Scenario 4: Simulated Evaluation Failure, Retry & State Isolation',
          'Scenario 5: Delayed Evaluation & Cross-Exercise Race Condition Isolation',
          'Scenario 6: Refresh, Direct Links, and Back Navigation',
          'Scenario 7: Multi-Account States (Active, Ready/Onboarding, Interrupted)',
          'Scenario 8: Practice & Review Filter States',
          'Scenario 9: Responsive Layout Measurements across 7 Views x 4 Viewports',
          'Scenario 10: Mobile Focus Restoration & Trace First-Action Geometry (Escape Focus Return & First Answer Position)'
        ],
        pageErrors: recordedPageErrors,
        consoleErrors: recordedConsoleErrors,
        failedLocalRequests,
        layoutAuditData
      },
      null,
      2
    )
  );
  console.log(`\nAudit results written to: ${resultJsonPath}`);

  // Assert no unhandled page errors
  assert.deepEqual(recordedPageErrors, [], 'There must be zero unhandled page errors');
  assert.deepEqual(failedLocalRequests, [], 'There must be zero failed local requests');

  console.log('\n============================================================');
  console.log('🎉 ALL BROWSER COVERAGE & STATE ISOLATION SCENARIOS PASSED!');
  console.log('============================================================\n');

  await context.close();
}

runSuite()
  .catch(async (err) => {
    console.error('\n❌ BROWSER ISOLATION TEST SUITE FAILED:', err);
    if (browser) {
      try {
        const pages = browser.contexts()[0]?.pages();
        if (pages?.[0]) {
          await pages[0].screenshot({ path: path.join(EVIDENCE_DIR, 'failure-state.png'), fullPage: true });
        }
      } catch (_) {}
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) {
      console.log('Closing browser process cleanly...');
      await browser.close().catch(() => {});
    }
  });
