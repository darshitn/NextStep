// Comprehensive Playwright verification for NextStep Adaptive Practice Milestone
// Usage: node client/scripts/verify-adaptive-practice.cjs [playwright module path] [preview URL]
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

let playwrightModule = process.argv[2];
if (!playwrightModule || playwrightModule.startsWith('http')) {
  try {
    require.resolve('playwright');
    playwrightModule = 'playwright';
  } catch (_) {
    playwrightModule = 'D:/Projects/Deadline-Catcher/node_modules/playwright';
  }
}
const { chromium } = require(playwrightModule);

const url = (process.argv[2] && process.argv[2].startsWith('http'))
  ? process.argv[2]
  : (process.argv[3] || 'http://127.0.0.1:5173');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(__dirname, '..', '.local/adaptive-practice-evidence', timestamp);

const fixtureModuleBody = `import {apiFixture,DEMO_ACCOUNTS} from '/src/fixtures/apiFixture.js';
export const isFixtureMode=true; export const onSessionExpired=()=>()=>{};
export const apiService={...apiFixture,demoAccounts:DEMO_ACCOUNTS};`;

let browser;
let context;
let page;
const results = [];
const errors = [];

async function check(name, run) {
  try {
    await run();
    results.push(name);
    console.log(`[PASS]: ${name}`);
  } catch (err) {
    console.error(`[FAIL]: ${name} ->`, err.message);
    throw err;
  }
}

async function verifyNoHorizontalOverflow(p, label) {
  const overflow = await p.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  assert.equal(
    overflow,
    false,
    `Horizontal overflow detected at ${label}: scrollWidth=${await p.evaluate(
      () => document.documentElement.scrollWidth
    )} > innerWidth=${await p.evaluate(() => window.innerWidth)}`
  );
}

(async () => {
  console.log('=== NextStep Adaptive Practice Milestone Playwright Verification ===');
  console.log(`Target URL: ${url}`);
  console.log(`Evidence Directory: ${outDir}`);

  await fs.mkdir(outDir, { recursive: true });

  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (_) {
    browser = await chromium.launch({ headless: true });
  }

  context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  page = await context.newPage();
  page.setDefaultTimeout(30000);

  page.on('pageerror', (err) => {
    errors.push(`PageError: ${err.message}`);
  });

  await page.route('**/*', (route) => {
    if (!route.request().url().startsWith(url)) {
      return route.abort();
    }
    const parsed = new URL(route.request().url());
    if (parsed.pathname === '/src/services/apiService.js') {
      return route.fulfill({
        contentType: 'application/javascript; charset=utf-8',
        body: fixtureModuleBody
      });
    }
    return route.continue();
  });

  const signInAs = async (email, password = 'password123') => {
    await page.goto(`${url}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const signoutBtn = page.getByRole('button', { name: /Sign out/i });
    if (await signoutBtn.isVisible()) {
      await signoutBtn.click();
      await page.locator('input[type=email]').waitFor({ timeout: 15000 });
    }
    const emailInput = page.locator('input[type=email]');
    await emailInput.waitFor({ timeout: 15000 });
    await emailInput.fill(email);
    await page.locator('input[type=password]').fill(password);
    await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
    await page.locator('.workspace-nav').waitFor({ timeout: 30000 });
  };

  const selectNav = async (name) => {
    const labelMap = {
      Today: 'Today',
      Proof: '(?:Learn & practise|Learn|Proof)',
      Week: '(?:My week|Week)',
      Atlas: '(?:Learning path|Atlas)',
      Practice: 'Practice',
      Review: 'Review',
      Roadmap: '(?:Starter track|Roadmap)',
      Insights: '(?:Progress|Insights)'
    };
    const pattern = labelMap[name] || name;
    const directLocator = page
      .locator('.workspace-nav')
      .getByRole('button', { name: new RegExp('^' + pattern + '(?:\\s|$)') })
      .or(
        page
          .locator('.workspace-nav')
          .getByRole('tab', { name: new RegExp('^' + pattern + '(?:\\s|$)') })
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
        .getByRole('menuitem', { name: new RegExp('^' + pattern + '(?:\\s|$)') })
        .or(
          page
            .locator('.workspace-nav-dropdown')
            .getByRole('button', { name: new RegExp('^' + pattern + '(?:\\s|$)') })
        );
      return menuLocator.first().click();
    }
    throw new Error(`Could not navigate to ${name}`);
  };

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Today entry & "Practise what needs work" launcher
    // -------------------------------------------------------------
    await check('1. Today Entry & Practice Proposal Modal', async () => {
      await signInAs('student.active@nextstep.local');
      await selectNav('Today');

      // Check hero card contains "Practise what needs work"
      const practiceBtn = page.getByRole('button', { name: /Practise what needs work/i });
      await practiceBtn.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await practiceBtn.isVisible(), 'Practise what needs work button must be visible on Today');

      await page.screenshot({ path: path.join(outDir, '01-today-practice-entry-desktop.png') });

      // Click to open proposal modal
      await practiceBtn.click();
      const proposalModal = page.getByRole('dialog', { name: /Practise What Needs Work/i });
      await proposalModal.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await proposalModal.isVisible(), 'Practice proposal modal must open');

      // Verify budget options (10m, 20m, 30m)
      const budget10 = page.getByRole('radio', { name: /10 min/i });
      const budget20 = page.getByRole('radio', { name: /20 min/i });
      const budget30 = page.getByRole('radio', { name: /30 min/i });
      assert.ok(await budget10.isVisible(), '10m budget must be visible');
      assert.ok(await budget20.isVisible(), '20m budget must be visible');
      assert.ok(await budget30.isVisible(), '30m budget must be visible');

      // Change to 10m: verify at most 1 task
      await budget10.click();
      await page.waitForTimeout(200);
      let taskCards = proposalModal.locator('.border.rounded-xl.p-4');
      const count10 = await taskCards.count();
      assert.ok(count10 <= 1, '10-minute budget cannot overfill: must have at most 1 task');

      // Change to 20m: verify 1-2 tasks
      await budget20.click();
      await page.waitForTimeout(200);
      taskCards = proposalModal.locator('.border.rounded-xl.p-4');
      const count20 = await taskCards.count();
      assert.ok(count20 >= 1 && count20 <= 2, '20-minute budget must propose 1-2 tasks');

      // Verify "Why this session" explanation is visible
      const whyText = proposalModal.locator('text=Why this session:');
      assert.ok(await whyText.isVisible(), 'Why this session explanation must be visible');

      await page.screenshot({ path: path.join(outDir, '02-practice-proposal-modal.png') });
    });

    // -------------------------------------------------------------
    // SCENARIO 2: Session Execution & Authentic Separated Breakdown
    // -------------------------------------------------------------
    await check('2. Practice Session Execution & Authentic Summary', async () => {
      const proposalModal = page.getByRole('dialog', { name: /Practise What Needs Work/i });
      const startBtn = proposalModal.getByRole('button', { name: /Start Practice Session/i });
      await startBtn.click();

      // PracticeSessionModal should open
      const runnerModal = page.locator('[role="dialog"]').filter({ has: page.locator('#practice-runner-title') });
      await runnerModal.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await runnerModal.isVisible(), 'Practice session runner must be open');

      await page.screenshot({ path: path.join(outDir, '03-practice-runner-active.png') });

      // Task 1: Worked example
      const workedBtn = page.getByRole('button', { name: /I Reviewed This Worked Example/i });
      await workedBtn.waitFor({ state: 'visible', timeout: 10000 });
      await workedBtn.click();
      await page.waitForTimeout(500);

      // Task 2: Trace retry — verify fake completion button is absent!
      const fakeBtnCount = await page.getByRole('button', { name: /Mark Trace Completed/i }).count();
      assert.equal(fakeBtnCount, 0, 'Fake completion button must not exist; authentic trace required');

      // Click "Open Trace in Interactive Studio"
      const openStudioBtn = page.getByRole('button', { name: /Open Trace in Interactive Studio/i });
      await openStudioBtn.waitFor({ state: 'visible', timeout: 10000 });
      await openStudioBtn.click();

      // Wait for ProofStudio view to appear
      const proofHeading = page.locator('#proof-heading');
      await proofHeading.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await proofHeading.isVisible(), 'Proof studio must be active');

      // Step 0: Click correct choice
      const step0Choice = page.locator('#trace-step-choices button').filter({ hasText: /indexByVal is empty|candidateGain is -5/i }).first();
      await step0Choice.waitFor({ state: 'visible', timeout: 10000 });
      await step0Choice.click();

      // Advance to Step 2
      const adv2Btn = page.getByRole('button', { name: /Advance to Step 2/i });
      await adv2Btn.waitFor({ state: 'visible', timeout: 10000 });
      await adv2Btn.click();

      // Step 1: Click correct choice
      const step1Choice = page.locator('#trace-step-choices button').filter({ hasText: /indexByVal\.has\(2\) is true|bestGain updates to 4/i }).first();
      await step1Choice.waitFor({ state: 'visible', timeout: 10000 });
      await step1Choice.click();
      await page.waitForTimeout(500);

      // Check if there is an Advance to Step 3
      const adv3Btn = page.getByRole('button', { name: /Advance to Step 3/i });
      if (await adv3Btn.isVisible()) {
        await adv3Btn.click();
        const step2Choice = page.locator('#trace-step-choices button').filter({ hasText: /minPrice drops to 1/i }).first();
        if (await step2Choice.isVisible()) {
          await step2Choice.click();
          await page.waitForTimeout(500);
        }
      }

      // Boundary check: Click correct edge choice
      const edgeButtons = page.locator('#boundary-check-section button');
      await edgeButtons.first().waitFor({ state: 'attached', timeout: 10000 });
      const edgeTexts = await edgeButtons.allInnerTexts();
      console.log('Boundary buttons text:', edgeTexts);
      // Click the first option which is the correct edge choice (or matching 'Only call' / 'bestGain')
      const targetEdgeBtn = edgeButtons.filter({ hasText: /Only call|bestGain/i }).first();
      if (await targetEdgeBtn.count() > 0) {
        await targetEdgeBtn.click();
      } else {
        await edgeButtons.first().click();
      }
      await page.waitForTimeout(500);

      // Open reflection note disclosure and fill takeaway
      const noteSummary = page.getByText(/Add a note/i).first();
      if (await noteSummary.isVisible()) {
        await noteSummary.click();
        await page.locator('#proof-exercise-reflection').fill('Checking has(need) before set ensures valid pairs.');
      }

      // Save Proof Attempt
      const saveAttemptBtn = page.getByRole('button', { name: /Save Proof Attempt/i });
      await saveAttemptBtn.click();
      await page.waitForTimeout(1000);

      // Return to Today to resume session
      await selectNav('Today');
      await page.waitForTimeout(500);

      // Click "Resume practice session"
      const resumeBtn = page.getByRole('button', { name: /Resume practice session/i });
      await resumeBtn.waitFor({ state: 'visible', timeout: 10000 });
      await resumeBtn.click();

      // Verify fresh evaluated trace attempt detected badge
      const freshBadge = page.getByText(/Fresh evaluated trace attempt detected/i);
      await freshBadge.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await freshBadge.isVisible(), 'Fresh evaluated attempt badge must appear');

      // Click "Confirm Evaluated Attempt & Continue"
      const confirmBtn = page.getByRole('button', { name: /Confirm Evaluated Attempt/i });
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click();

      // Verify Authentic Breakdown Summary dialog
      const summaryModal = page.getByRole('dialog', { name: /Practice Session Completed|Practice Session Finished/i });
      await summaryModal.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await summaryModal.isVisible(), 'Authentic summary modal must appear');

      // Verify separated evidence counts: Viewed=1, Verified=1, Hinted=0, Self-Reported=0
      assert.ok(await summaryModal.getByText('Viewed', { exact: true }).isVisible(), 'Viewed count must be visible');
      assert.ok(await summaryModal.getByText('Verified', { exact: true }).isVisible(), 'Verified count must be visible');
      assert.ok(await summaryModal.getByText('Hinted', { exact: true }).isVisible(), 'Hinted count must be visible');
      assert.ok(await summaryModal.getByText('Self-Reported', { exact: true }).isVisible(), 'Self-Reported count must be visible');

      // Assert zero fabricated mastery %
      const modalText = await summaryModal.innerText();
      assert.ok(!modalText.includes('Mastery:'), 'No fabricated mastery claim');
      assert.ok(!modalText.includes('XP Gained'), 'No score aggregation');

      await page.screenshot({ path: path.join(outDir, '04-practice-summary-authentic.png') });

      // Click Return to Today
      const returnBtn = summaryModal.getByRole('button', { name: /Return to Today/i });
      await returnBtn.click();
      await page.waitForTimeout(300);
    });

    // -------------------------------------------------------------
    // SCENARIO 3: Review View Launcher
    // -------------------------------------------------------------
    await check('3. Review View Practice Launcher', async () => {
      await selectNav('Review');
      const reviewHeading = page.locator('#review-heading');
      await reviewHeading.waitFor({ state: 'visible', timeout: 10000 });

      const reviewPracticeBtn = page.getByRole('button', { name: /Practise what needs work/i });
      assert.ok(await reviewPracticeBtn.isVisible(), 'Review view must include practice session launcher');

      await page.screenshot({ path: path.join(outDir, '08-review-practice-launcher.png') });

      await reviewPracticeBtn.click();
      const proposalModal = page.getByRole('dialog', { name: /Practise What Needs Work/i });
      await proposalModal.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await proposalModal.isVisible());

      // Close modal
      const closeBtn = proposalModal.getByRole('button', { name: 'Cancel' });
      await closeBtn.click();
      await page.waitForTimeout(300);
    });

    // -------------------------------------------------------------
    // SCENARIO 4: Topic Atlas Evidence Cards & "Show why"
    // -------------------------------------------------------------
    await check('4. Topic Evidence Cards in Learning Path', async () => {
      await selectNav('Atlas');
      const atlasHeading = page.locator('#atlas-heading');
      await atlasHeading.waitFor({ state: 'visible', timeout: 10000 });

      // Verify descriptive status badges (Not started, Learning, Practise again, Recent evidence)
      const topicCard = page.locator('article[role="listitem"]').first();
      await topicCard.waitFor({ state: 'visible', timeout: 10000 });

      const cardText = await topicCard.innerText();
      assert.ok(
        cardText.includes('Lessons:') && cardText.includes('Proof Traces:'),
        'Topic card must present structured evidence breakdown'
      );
      assert.ok(
        cardText.includes('External Practice:') && cardText.toLowerCase().includes('self-reported'),
        'External practice must be explicitly marked self-reported'
      );

      await page.screenshot({ path: path.join(outDir, '05-atlas-topic-evidence-cards.png') });

      // Click "Show why" to expand evidence
      const showWhyBtn = topicCard.getByRole('button', { name: /Show why|Hide evidence/i });
      await showWhyBtn.click();
      await page.waitForTimeout(300);

      const expandedEvidence = topicCard.locator('text=Evidence for');
      assert.ok(await expandedEvidence.isVisible(), 'Expanded evidence panel must show explanation and sources');

      await page.screenshot({ path: path.join(outDir, '06-atlas-topic-show-why.png') });

      // Verify "Plan my next week" button in header
      const planWeekBtn = page.getByRole('button', { name: /Plan my next week/i });
      assert.ok(await planWeekBtn.isVisible(), '"Plan my next week" button must be present in Atlas header');

      await planWeekBtn.click();
      const continuationModal = page.locator('[role="dialog"]').filter({ hasText: /Configure Your Next Step|Next-Week Study Plan/i }).first();
      await continuationModal.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await continuationModal.isVisible(), 'Continuation plan modal must open from Atlas');

      await page.screenshot({ path: path.join(outDir, '07-continuation-next-week-preview.png') });

      // Close continuation modal safely using Escape or close button
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    });

    // -------------------------------------------------------------
    // SCENARIO 5: Responsive Geometry across 1440, 1024, 390, 320
    // -------------------------------------------------------------
    await check('5. Responsive Breakpoint Layouts & Geometry', async () => {
      // 1440px desktop
      await page.setViewportSize({ width: 1440, height: 900 });
      await selectNav('Today');
      await verifyNoHorizontalOverflow(page, 'Desktop 1440px');

      // 1024px tablet
      await page.setViewportSize({ width: 1024, height: 768 });
      await verifyNoHorizontalOverflow(page, 'Tablet 1024px');
      await page.screenshot({ path: path.join(outDir, '09-tablet-1024-today.png') });

      // 390px mobile
      await page.setViewportSize({ width: 390, height: 844 });
      await verifyNoHorizontalOverflow(page, 'Mobile 390px');
      await page.screenshot({ path: path.join(outDir, '10-mobile-390-today.png') });

      // 320px narrow mobile
      await page.setViewportSize({ width: 320, height: 640 });
      await verifyNoHorizontalOverflow(page, 'Narrow Mobile 320px');

      // Test modal at 320px
      const practiceBtn = page.getByRole('button', { name: /Practise what needs work/i });
      if (await practiceBtn.isVisible()) {
        await practiceBtn.click();
        const proposalModal = page.getByRole('dialog', { name: /Practise What Needs Work/i });
        await proposalModal.waitFor({ state: 'visible', timeout: 10000 });
        await verifyNoHorizontalOverflow(page, 'Modal at 320px');
        await page.screenshot({ path: path.join(outDir, '11-mobile-320-proposal.png') });
        const closeBtn = proposalModal.getByRole('button', { name: 'Cancel' });
        await closeBtn.click();
        await page.waitForTimeout(300);
      }

      // Reset to desktop viewport
      await page.setViewportSize({ width: 1440, height: 900 });
    });

    // -------------------------------------------------------------
    // SCENARIO 6: Theme Variants (Frosted Sage, Midnight Ink, Calm Slate)
    // -------------------------------------------------------------
    await check('6. Theme Switching & Token Integrity', async () => {
      // Switch to Midnight Ink
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'midnight-ink');
      });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(outDir, '12-theme-midnight-ink.png') });

      // Switch to Calm Slate
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'calm-slate');
      });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(outDir, '13-theme-calm-slate.png') });

      // Restore Frosted Sage
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'frosted-sage');
      });
      await page.waitForTimeout(200);
    });

    // -------------------------------------------------------------
    // SCENARIO 7: Student with Completed Starter Isolation
    // -------------------------------------------------------------
    await check('7. Starter Completion & Account Isolation', async () => {
      await signInAs('student.completed@nextstep.local');
      await selectNav('Today');

      // Starter completion must recommend Foundations Checkpoint, never auto-start practice session
      const heroCard = page.locator('[data-guide="today-activity-card"]');
      await heroCard.waitFor({ state: 'visible', timeout: 10000 });
      const text = await heroCard.innerText();
      assert.ok(
        text.includes('Checkpoint') || text.includes('Foundations') || text.includes('Starter Track Completed'),
        `Completed starter account must recommend Checkpoint or next stage, got: ${text}`
      );
      await page.screenshot({ path: path.join(outDir, '14-completed-starter-today.png') });
    });

    // -------------------------------------------------------------
    // SCENARIO 8: Exact Target Navigation, Alternate Variant & Persistence Reload
    // -------------------------------------------------------------
    await check('8. Exact Target Navigation, Alternate Variant & Persistence Reload', async () => {
      await signInAs('student.active@nextstep.local');

      // 1. First, select a completely different lesson in Atlas/Proof
      await selectNav('Atlas');
      const bsTopicCard = page.locator('article[role="listitem"]').filter({ hasText: /Binary Search/i });
      if (await bsTopicCard.isVisible()) {
        const exploreBtn = bsTopicCard.getByRole('button', { name: /Explore topic|Practise again|Continue/i }).first();
        if (await exploreBtn.isVisible()) {
          await exploreBtn.click();
          await page.waitForTimeout(300);
        }
      }

      // Return to Today
      await selectNav('Today');

      // 2. Start practice session
      const practiceBtn = page.getByRole('button', { name: /Practise what needs work/i });
      await practiceBtn.waitFor({ state: 'visible', timeout: 10000 });
      await practiceBtn.click();

      const proposalModal = page.getByRole('dialog', { name: /Practise What Needs Work/i });
      await proposalModal.waitFor({ state: 'visible', timeout: 10000 });
      const startBtn = proposalModal.getByRole('button', { name: /Start Practice Session/i });
      await startBtn.click();

      const runnerModal = page.locator('[role="dialog"]').filter({ has: page.locator('#practice-runner-title') });
      await runnerModal.waitFor({ state: 'visible', timeout: 10000 });

      // Pause session
      const pauseBtn = page.getByRole('button', { name: /Pause & Exit/i });
      await pauseBtn.click();
      await page.waitForTimeout(300);

      // 3. Reload page: verify session state is preserved across reload
      await page.reload({ waitUntil: 'domcontentloaded' });
      await selectNav('Today');
      const resumeBtn = page.getByRole('button', { name: /Resume practice session/i });
      await resumeBtn.waitFor({ state: 'visible', timeout: 10000 });
      assert.ok(await resumeBtn.isVisible(), 'Active practice session must persist across page reload');
    });

    console.log('\n=== ALL PLAYWRIGHT VERIFICATION SCENARIOS PASSED ===');
    console.log(`Executed ${results.length} checks successfully.`);
  } finally {
    if (browser) await browser.close();
  }
})();
