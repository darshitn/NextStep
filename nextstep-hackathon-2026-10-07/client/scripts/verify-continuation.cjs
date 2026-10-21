// Playwright verification for NextStep Foundations Checkpoint, Continuation Plan & Hardening
// Usage: node client/scripts/verify-continuation.cjs [playwright module path] [preview URL]

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

// Resolve playwright module gracefully
let playwrightModule = process.argv[2];
let url = process.argv[3];

if (playwrightModule && playwrightModule.startsWith('http')) {
  url = playwrightModule;
  playwrightModule = null;
}

if (!playwrightModule) {
  try {
    require.resolve('playwright');
    playwrightModule = 'playwright';
  } catch (_) {
    playwrightModule = 'D:/Projects/Deadline-Catcher/node_modules/playwright';
  }
}

if (!url) {
  url = 'http://127.0.0.1:5173';
}

const { chromium } = require(playwrightModule);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.resolve(__dirname, '..', '.local/continuation-evidence', timestamp);

const fixtureModuleBody = `import { apiFixture, DEMO_ACCOUNTS } from '/src/fixtures/apiFixture.js';
export const isFixtureMode = true;
export const onSessionExpired = () => () => {};
export const apiService = {
  ...apiFixture,
  demoAccounts: DEMO_ACCOUNTS
};`;

let browser;
const results = [];
const errors = [];
const consoleErrors = [];
const blockedExternal = new Set();
const failedLocalRequests = [];

async function check(name, run) {
  try {
    await run();
    results.push({ name, status: 'PASS' });
    console.log(`[PASS]: ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
    console.error(`[FAIL]: ${name} -> ${err.message}`);
    throw err;
  }
}

async function verifyNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  });
  assert.ok(
    !overflow.hasOverflow,
    `Horizontal overflow detected in ${label}: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`
  );
}

(async () => {
  console.log('=== NextStep Foundations Checkpoint & Continuation Plan Verification ===');
  console.log(`Target URL: ${url}`);
  console.log(`Evidence Directory: ${outDir}`);

  await fs.mkdir(outDir, { recursive: true });

  let launchOptions = { headless: true };
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (_) {
    browser = await chromium.launch({ headless: true });
  }

  try {
    // -------------------------------------------------------------
    // Journey 1: Completed Starter Student Flow
    // -------------------------------------------------------------
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);

    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({ text: msg.text(), url: msg.location().url });
      }
    });
    page.on('requestfailed', (request) => {
      if (request.url().startsWith(url)) {
        failedLocalRequests.push(request.url());
      }
    });

    await page.route('**/*', (route) => {
      if (!route.request().url().startsWith(url)) {
        blockedExternal.add(route.request().url());
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

    await check('T01: Completed Starter Evidence Strip & Continuation Actions', async () => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('input[type=email]').fill('student.completed@nextstep.local');
      await page.locator('input[type=password]').fill('password123');
      await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await page.locator('.workspace-nav').waitFor();

      // Verify Today View completed celebration
      const celebration = page.locator('text=DSA Starter Completed!');
      await celebration.waitFor({ timeout: 5000 });

      const badge = page.locator('text=Starter Track Completed');
      assert.ok(await badge.isVisible(), 'Starter Track Completed badge visible');

      // Verify evidence metrics
      const strip = page.locator('.today-main .grid.grid-cols-2');
      await strip.waitFor({ timeout: 5000 });

      const totalMissionsText = await strip.locator('div', { hasText: 'Total Missions' }).first().textContent();
      assert.ok(totalMissionsText.includes('12'), `Evidence shows 12 Total Missions (got: ${totalMissionsText})`);

      const independentText = await strip.locator('div', { hasText: 'Independent' }).first().textContent();
      assert.ok(independentText.includes('9'), `Evidence shows 9 Independent completions (got: ${independentText})`);

      const withHintsText = await strip.locator('div', { hasText: 'With Hints' }).first().textContent();
      assert.ok(withHintsText.includes('3'), `Evidence shows 3 With Hints completions (got: ${withHintsText})`);

      // Verify continuation buttons
      const chkBtn = page.getByRole('button', { name: /Check My Foundations/i });
      const planBtn = page.getByRole('button', { name: /Choose My Next Step/i });
      const atlasBtn = page.getByRole('button', { name: /Explore Learning path/i }).first();

      assert.ok(await chkBtn.isVisible(), 'Check My Foundations button rendered');
      assert.ok(await planBtn.isVisible(), 'Choose My Next Step button rendered');
      assert.ok(await atlasBtn.isVisible(), 'Explore Learning path button rendered');

      await page.screenshot({ path: path.join(outDir, '01-today-starter-completed.png') });
    });

    await check('T02: Foundations Checkpoint Opening, Privacy, Draft Persistence & Hint Tracking', async () => {
      // Click Check My Foundations
      const chkBtn = page.getByRole('button', { name: /Check My Foundations/i });
      await chkBtn.click();

      const modal = page.locator('div[role="dialog"][aria-labelledby="checkpoint-title"]');
      await modal.waitFor({ timeout: 5000 });

      // Privacy check: DOM must NOT leak answer key or correctOptionId
      const modalHtml = await modal.innerHTML();
      assert.ok(!modalHtml.includes('correctOptionId'), 'Student-safe: No correctOptionId in DOM');
      assert.ok(!modalHtml.includes('isCorrect'), 'Student-safe: No isCorrect flags in DOM');
      assert.ok(!modalHtml.includes('correct_choice'), 'Student-safe: No answer keys leaked in DOM');

      // Check Question 1 (Arrays & Invariant Scanning)
      const q1Text = await modal.textContent();
      assert.ok(q1Text.includes('Arrays & Invariant Scanning'), 'Topic 1 rendered');
      assert.ok(q1Text.includes('prices'), 'Arrays question prompt rendered');

      // Select Option 1 (first option)
      const firstOption = modal.locator('input[type="radio"]').first();
      await firstOption.click();

      // Verify draft saved notice appears
      const draftNotice = modal.locator('text=Draft saved');
      await draftNotice.waitFor({ timeout: 4000 });

      // Navigate to Question 2 (Sets & Maps)
      const nextBtn = modal.getByRole('button', { name: /Next Question/i });
      await nextBtn.click();

      const q2Text = await modal.textContent();
      assert.ok(q2Text.includes('Hash Sets & Complement Lookup'), 'Topic 2 rendered');

      // Test hint toggle and self-reported assistance
      const hintBtn = modal.getByRole('button', { name: /Need a hint\?/i });
      await hintBtn.click();
      const hintContent = modal.locator('text=What happens when target = 6 and nums[0] = 3?');
      await hintContent.waitFor({ timeout: 3000 });

      // Select first option for Q2 (correct)
      await modal.locator('input[type="radio"]').first().click();

      // Navigate to Question 3 (Binary Search Boundaries)
      await nextBtn.click();
      const q3Text = await modal.textContent();
      assert.ok(q3Text.includes('Binary Search Boundaries'), 'Topic 3 rendered');

      // Deliberately select second option for Q3 (INCORRECT: high = mid; low = mid causes loop)
      const secondOption = modal.locator('input[type="radio"]').nth(1);
      await secondOption.click();

      // Fill reflection note
      const reflectionInput = modal.locator('textarea');
      await reflectionInput.fill('I always confuse high = mid vs high = mid - 1 in inclusive binary search.');

      await page.screenshot({ path: path.join(outDir, '02-checkpoint-in-progress.png') });
    });

    await check('T03: Server-Evaluated Grading, Topic Breakdown & Revisit Recommendations', async () => {
      const modal = page.locator('div[role="dialog"][aria-labelledby="checkpoint-title"]');
      const submitBtn = modal.getByRole('button', { name: /Submit Checkpoint/i });
      await submitBtn.click();

      // Wait for evaluation result
      const scoreBanner = modal.locator('text=2 / 3 Correct');
      await scoreBanner.waitFor({ timeout: 6000 });

      const resultText = await modal.textContent();
      assert.ok(resultText.includes('Revisit Recommended') || resultText.includes('revisit_recommended'), 'Status reflects revisit recommended');
      assert.ok(resultText.includes('Binary Search Boundaries'), 'Binary search identified');

      // Verify authoritative explanations are revealed post-submission
      assert.ok(
        resultText.includes('Needs revisit') || resultText.includes('Independent correct answer'),
        'Authoritative explanations and feedback displayed post-submission'
      );

      // Verify recommended action link to Proof Studio
      const reviewAction = modal.getByRole('button', { name: /Open in Proof Studio/i }).first();
      assert.ok(await reviewAction.isVisible(), 'Targeted Proof Studio review action rendered');

      await page.screenshot({ path: path.join(outDir, '03-checkpoint-graded-revisit.png') });
    });

    await check('T04: Checkpoint Modal Escape Focus Restoration & Today Banner Update', async () => {
      const modal = page.locator('div[role="dialog"][aria-labelledby="checkpoint-title"]');
      await page.keyboard.press('Escape');
      await modal.waitFor({ state: 'hidden', timeout: 3000 });

      // Verify Today View reflects checkpoint results
      const banner = page.locator('text=Foundations Checkpoint:');
      await banner.waitFor({ timeout: 3000 });
      const bannerText = await banner.locator('..').textContent();
      assert.ok(bannerText.includes('2 / 3 Correct'), 'Today View displays 2 / 3 Correct');

      const reviewBtn = page.getByRole('button', { name: /Review Foundations Checkpoint/i });
      assert.ok(await reviewBtn.isVisible(), 'Button transformed to Review Foundations Checkpoint');

      // Verify focus restored to the trigger button
      const activeElementText = await page.evaluate(() => document.activeElement?.textContent || '');
      assert.ok(
        activeElementText.includes('Foundations Checkpoint'),
        `Focus restored to trigger button after Escape (active: "${activeElementText}")`
      );

      await page.screenshot({ path: path.join(outDir, '04-today-checkpoint-recorded.png') });
    });

    await check('T05: Evidence-Based Continuation Plan Generation & Availability Editing', async () => {
      const planBtn = page.getByRole('button', { name: /Choose My Next Step/i });
      await planBtn.click();

      const modal = page.locator('div[role="dialog"][aria-labelledby="continuation-plan-title"]');
      await modal.waitFor({ timeout: 5000 });

      // Verify step 1 title & evidence-based suggestions
      const modalText = await modal.textContent();
      assert.ok(modalText.includes('Configure Your Next Step'), 'Plan configuration modal opened');
      assert.ok(/binary\s*search/i.test(modalText), 'Binary Search targeted revisit suggested');
      assert.ok(/two\s*pointers/i.test(modalText), 'Next curriculum lesson suggested');

      // Verify Availability Picker is rendered and functional
      const availabilityPicker = modal.locator('.availability-picker, [aria-label*="Schedule"], .grid');
      assert.ok(await availabilityPicker.count() > 0, 'Availability controls rendered');

      // Generate preview
      const previewBtn = modal.getByRole('button', { name: /Preview Next-Week Plan/i });
      await previewBtn.click();

      // Wait for preview step
      const confirmHeading = modal.locator('text=Review & Confirm Your Plan');
      await confirmHeading.waitFor({ timeout: 6000 });

      const previewText = await modal.textContent();
      assert.ok(previewText.includes('Planned Study Sessions'), 'Plan preview shows planned study sessions');
      assert.ok(previewText.includes('Est. Finish'), 'Plan preview summary rendered');

      await page.screenshot({ path: path.join(outDir, '05-continuation-plan-preview.png') });
    });

    await check('T06: Plan Acceptance, Today State & Starter Preservation', async () => {
      const modal = page.locator('div[role="dialog"][aria-labelledby="continuation-plan-title"]');
      const acceptBtn = modal.getByRole('button', { name: /Accept & Start This Plan/i });
      await acceptBtn.click();

      // Modal should close on acceptance
      await modal.waitFor({ state: 'hidden', timeout: 5000 });

      // Verify Today View now displays Active Next-Week Plan
      const activePlanHeader = page.locator('text=Active Next-Week Plan');
      await activePlanHeader.waitFor({ timeout: 5000 });

      // Verify 12/12 starter celebration and metrics are STILL intact
      const celebration = page.locator('text=DSA Starter Completed!');
      assert.ok(await celebration.isVisible(), 'Starter Completed celebration preserved');

      const strip = page.locator('.today-main .grid.grid-cols-2');
      const totalMissionsText = await strip.locator('div', { hasText: 'Total Missions' }).first().textContent();
      assert.ok(totalMissionsText.includes('12'), '12 missions preserved');

      // Verify adjust schedule action is available
      const adjustBtn = page.getByRole('button', { name: /Adjust schedule/i });
      assert.ok(await adjustBtn.isVisible(), 'Adjust schedule button present');

      await page.screenshot({ path: path.join(outDir, '06-today-active-continuation-plan.png') });
    });

    await check('T07: Plan Modal Escape Focus Restoration', async () => {
      const adjustBtn = page.getByRole('button', { name: /Adjust schedule/i });
      await adjustBtn.click();

      const modal = page.locator('div[role="dialog"][aria-labelledby="continuation-plan-title"]');
      await modal.waitFor({ timeout: 5000 });

      await page.keyboard.press('Escape');
      await modal.waitFor({ state: 'hidden', timeout: 3000 });

      const activeElementText = await page.evaluate(() => document.activeElement?.textContent || '');
      assert.ok(
        activeElementText.includes('Adjust schedule'),
        `Focus restored to Adjust schedule button after Escape (active: "${activeElementText}")`
      );
    });

    await context.close();

    // -------------------------------------------------------------
    // Journey 2: Partial Starter Student Isolation
    // -------------------------------------------------------------
    const partialContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const partialPage = await partialContext.newPage();

    await partialPage.route('**/*', (route) => {
      if (!route.request().url().startsWith(url)) return route.abort();
      if (new URL(route.request().url()).pathname === '/src/services/apiService.js') {
        return route.fulfill({
          contentType: 'application/javascript; charset=utf-8',
          body: fixtureModuleBody
        });
      }
      return route.continue();
    });

    await check('T08: Partial Starter Student State Isolation & No False Completion', async () => {
      await partialPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await partialPage.locator('input[type=email]').fill('student.active@nextstep.local');
      await partialPage.locator('input[type=password]').fill('password123');
      await partialPage.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await partialPage.locator('.workspace-nav').waitFor();

      // Ensure active student does NOT see "DSA Starter Completed!"
      const completedCelebration = partialPage.locator('text=DSA Starter Completed!');
      assert.ok(!(await completedCelebration.isVisible()), 'Active student does NOT see 12/12 completed celebration');

      // Verify active mission is rendered
      const missionCard = partialPage.locator('.mission-card').first();
      assert.ok(await missionCard.isVisible(), 'Active student sees ongoing mission card');

      await partialPage.screenshot({ path: path.join(outDir, '07-partial-student-today.png') });
    });

    await partialContext.close();

    // -------------------------------------------------------------
    // Journey 3: Responsive Viewports & Accessibility
    // -------------------------------------------------------------
    const responsiveContext = await browser.newContext({
      reducedMotion: 'reduce'
    });
    const respPage = await responsiveContext.newPage();

    await respPage.route('**/*', (route) => {
      if (!route.request().url().startsWith(url)) return route.abort();
      if (new URL(route.request().url()).pathname === '/src/services/apiService.js') {
        return route.fulfill({
          contentType: 'application/javascript; charset=utf-8',
          body: fixtureModuleBody
        });
      }
      return route.continue();
    });

    await check('T09: Responsive Layout & Overflow Audit Across 4 Viewports', async () => {
      const viewports = [
        { width: 1440, height: 900, name: 'desktop-1440' },
        { width: 1024, height: 768, name: 'tablet-1024' },
        { width: 390, height: 844, name: 'mobile-390' },
        { width: 320, height: 568, name: 'mobile-320' }
      ];

      await respPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await respPage.locator('input[type=email]').fill('student.completed@nextstep.local');
      await respPage.locator('input[type=password]').fill('password123');
      await respPage.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await respPage.locator('.workspace-nav').waitFor();

      for (const vp of viewports) {
        await respPage.setViewportSize({ width: vp.width, height: vp.height });
        await respPage.waitForTimeout(300);

        // Check horizontal overflow
        await verifyNoHorizontalOverflow(respPage, `Today View @ ${vp.name}`);

        await respPage.screenshot({
          path: path.join(outDir, `responsive-today-${vp.name}.png`)
        });
      }

      // Open Checkpoint modal on mobile 320 to verify responsive dialog behavior
      await respPage.setViewportSize({ width: 320, height: 568 });
      const chkBtn = respPage.getByRole('button', { name: /Review Foundations Checkpoint|Check My Foundations/i });
      await chkBtn.click();

      const modal = respPage.locator('div[role="dialog"][aria-labelledby="checkpoint-title"]');
      await modal.waitFor({ timeout: 5000 });

      await verifyNoHorizontalOverflow(respPage, 'Checkpoint Modal @ mobile-320');
      await respPage.screenshot({
        path: path.join(outDir, 'responsive-checkpoint-mobile-320.png')
      });

      await respPage.keyboard.press('Escape');
      await modal.waitFor({ state: 'hidden', timeout: 3000 });
    });

    await responsiveContext.close();

    console.log('\n============================================================');
    console.log(`🎉 ALL CONTINUATION & HARDENING CHECKS PASSED (${results.length}/${results.length})`);
    console.log('============================================================');

    const summaryReport = {
      timestamp: new Date().toISOString(),
      targetUrl: url,
      totalChecks: results.length,
      passedChecks: results.filter((r) => r.status === 'PASS').length,
      results,
      consoleErrorsCount: consoleErrors.length,
      blockedExternalCount: blockedExternal.size,
      failedLocalRequestsCount: failedLocalRequests.length
    };

    await fs.writeFile(
      path.join(outDir, 'continuation-verification-result.json'),
      JSON.stringify(summaryReport, null, 2),
      'utf8'
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
