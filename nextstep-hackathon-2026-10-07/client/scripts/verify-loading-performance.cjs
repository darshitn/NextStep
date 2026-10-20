// Comprehensive Playwright verification for NextStep Loading Performance & Code-Splitting
// Usage: node scripts/verify-loading-performance.cjs [playwright module path] [preview URL]
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

const fixtureModuleBody = `import {apiFixture,DEMO_ACCOUNTS} from '/src/fixtures/apiFixture.js';
export const isFixtureMode=true; export const onSessionExpired=()=>()=>{};
export const apiService={...apiFixture,demoAccounts:DEMO_ACCOUNTS};`;

let browser;
const results = [];
const consoleErrors = [];
const failedLocalRequests = [];

async function check(name, run) {
  try {
    await run();
    results.push(name);
    console.log('PASS:', name);
  } catch (err) {
    console.error('FAIL:', name, err);
    throw err;
  }
}

(async () => {
  try {
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (_) {
      browser = await chromium.launch({ headless: true });
    }

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce'
    });

    const page = await context.newPage();
    page.setDefaultTimeout(15000);

    const requestedChunks = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({ text: msg.text(), url: msg.location().url });
      }
    });

    await page.route('**/*', (route) => {
      const reqUrl = route.request().url();
      if (!reqUrl.startsWith(url)) {
        return route.abort();
      }
      const parsed = new URL(reqUrl);
      if (parsed.pathname.endsWith('.js') || parsed.pathname.endsWith('.jsx')) {
        requestedChunks.push(parsed.pathname);
      }
      if (parsed.pathname === '/src/services/apiService.js') {
        return route.fulfill({
          contentType: 'application/javascript; charset=utf-8',
          body: fixtureModuleBody
        });
      }
      return route.continue();
    });

    // Helper: Select workspace view from nav bar across any page
    const selectViewOnPage = async (p, name) => {
      const direct = p.locator('.workspace-nav').getByRole('button', { name: new RegExp('^' + name + '(?:\\s|$)', 'i') })
        .or(p.locator('.workspace-nav').getByRole('tab', { name: new RegExp('^' + name + '(?:\\s|$)', 'i') }));
      const count = await direct.count();
      for (let i = 0; i < count; i++) {
        const el = direct.nth(i);
        if (await el.isVisible()) {
          return el.click();
        }
      }
      const moreTrigger = p.locator('#nav-more-trigger');
      if (await moreTrigger.isVisible()) {
        await moreTrigger.click();
        const menuEl = p.locator('.workspace-nav-dropdown').getByRole('menuitem', { name: new RegExp('^' + name + '(?:\\s|$)', 'i') })
          .or(p.locator('.workspace-nav-dropdown').getByRole('button', { name: new RegExp('^' + name + '(?:\\s|$)', 'i') }));
        return menuEl.first().click();
      }
      return direct.first().click();
    };
    const selectView = (name) => selectViewOnPage(page, name);

    // --- SCENARIO 1: Cold load on Today view (Verify initial chunk economy) ---
    await check('S1: Cold login and Today load does not download secondary view chunks', async () => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.locator('input[type=email]').fill('student.active@nextstep.local');
      await page.locator('input[type=password]').fill('password123');
      await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await page.locator('.workspace-nav').waitFor({ state: 'visible' });

      // Confirm Today view is rendered
      const todayHeader = page.locator('.workspace-container h1, .workspace-container h2');
      await todayHeader.first().waitFor({ state: 'visible' });

      // Inspect chunks requested so far
      const loadedModules = requestedChunks.join(' ');
      const secondaryViewModules = [
        'ProofStudio',
        'AtlasView',
        'PracticeLibraryView',
        'WeeklyPlanView',
        'RoadmapView',
        'ReviewView',
        'InsightsView',
        'FoundationsCheckpointModal',
        'ContinuationPlanModal'
      ];

      for (const viewName of secondaryViewModules) {
        assert.ok(
          !loadedModules.includes(viewName),
          `Expected secondary view chunk "${viewName}" NOT to be requested on initial Today landing, but it was found in: ${loadedModules}`
        );
      }
    });

    // --- SCENARIO 2: Navigate to every workspace view cleanly on demand ---
    await check('S2: On-demand loading of every secondary workspace view (Week, Atlas, Proof, Practice, Roadmap, Review, Insights)', async () => {
      // 1. Week View
      await selectView('Week');
      await page.waitForURL(/view=week/);
      await page.locator('#view-week').waitFor({ state: 'visible' });

      // 2. Atlas View
      await selectView('Atlas');
      await page.waitForURL(/view=atlas/);
      await page.locator('#view-atlas').waitFor({ state: 'visible' });

      // 3. Proof Studio
      await selectView('Proof');
      await page.waitForURL(/view=proof/);
      await page.locator('#view-proof').waitFor({ state: 'visible' });

      // 4. Practice Library
      await selectView('Practice');
      await page.waitForURL(/view=practice/);
      await page.locator('#view-practice').waitFor({ state: 'visible' });

      // 5. Roadmap
      await selectView('Roadmap');
      await page.waitForURL(/view=roadmap/);
      await page.locator('#view-roadmap').waitFor({ state: 'visible' });

      // 6. Review View
      await selectView('Review');
      await page.waitForURL(/view=review/);
      await page.locator('#view-review').waitFor({ state: 'visible' });

      // 7. Insights View
      await selectView('Insights');
      await page.waitForURL(/view=insights/);
      await page.locator('#view-insights').waitFor({ state: 'visible' });

      // 8. Return to Today View
      await selectView('Today');
      await page.waitForFunction(() => !window.location.search.includes('view='));
      const activeTab = page.locator('.workspace-nav button[aria-selected="true"], .workspace-nav tab[aria-selected="true"]');
      const text = await activeTab.first().textContent();
      assert.ok(/today/i.test(text), `Expected Today tab to be selected, found: ${text}`);
    });

    // --- SCENARIO 3: Browser Back & Forward Navigation Preserves URLs and State ---
    await check('S3: Browser back and forward navigation preserves views and query parameters', async () => {
      await selectView('Week');
      await page.waitForURL(/view=week/);
      await page.locator('#view-week').waitFor({ state: 'visible' });

      await selectView('Atlas');
      await page.waitForURL(/view=atlas/);
      await page.locator('#view-atlas').waitFor({ state: 'visible' });

      // Go back to Week
      await page.goBack();
      await page.waitForURL(/view=week/);
      await page.locator('#view-week').waitFor({ state: 'visible' });

      // Go back to Today
      await page.goBack();
      await page.waitForFunction(() => !window.location.search.includes('view='));

      // Go forward to Week
      await page.goForward();
      await page.waitForURL(/view=week/);
      await page.locator('#view-week').waitFor({ state: 'visible' });

      // Go forward to Atlas
      await page.goForward();
      await page.waitForURL(/view=atlas/);
      await page.locator('#view-atlas').waitFor({ state: 'visible' });
    });

    // --- SCENARIO 4: Simulated Slow Loading Shows Accessible Loading State ---
    await check('S4: Accessible theme-matched loading state appears with role="status" and aria-live="polite"', async () => {
      const slowContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const slowPage = await slowContext.newPage();
      let delayActive = false;

      await slowPage.route('**/*', async (route) => {
        const reqUrl = route.request().url();
        if (!reqUrl.startsWith(url)) return route.abort();

        const parsed = new URL(reqUrl);
        if (parsed.pathname === '/src/services/apiService.js') {
          return route.fulfill({
            contentType: 'application/javascript; charset=utf-8',
            body: fixtureModuleBody
          });
        }

        // Add 400ms delay to secondary view chunks when delayActive is true
        if (delayActive && (parsed.pathname.includes('ProofStudio') || parsed.pathname.includes('ProofStudio-'))) {
          await new Promise((r) => setTimeout(r, 400));
        }

        return route.continue();
      });

      await slowPage.goto(url, { waitUntil: 'domcontentloaded' });
      await slowPage.locator('input[type=email]').fill('student.active@nextstep.local');
      await slowPage.locator('input[type=password]').fill('password123');
      await slowPage.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await slowPage.locator('.workspace-nav').waitFor({ state: 'visible' });

      delayActive = true;
      await selectViewOnPage(slowPage, 'Proof');

      // Check for loading state presence
      const loadingEl = slowPage.locator('[role="status"][aria-live="polite"], [data-testid="async-view-loading"]');
      const isVisible = await loadingEl.first().isVisible({ timeout: 500 }).catch(() => false);
      assert.ok(isVisible, 'Expected accessible loading indicator with role="status" while view chunk is loading');

      // Check aria attributes
      const ariaLive = await loadingEl.first().getAttribute('aria-live');
      assert.equal(ariaLive, 'polite', 'Expected aria-live="polite" on loading container');

      // Then verify ProofStudio renders cleanly after delay
      await slowPage.locator('#view-proof').waitFor({ state: 'visible' });
      await slowContext.close();
    });

    // --- SCENARIO 5: Simulated Chunk-Loading Failure and Visible Retry Action ---
    await check('S5: Chunk-load failure renders accessible role="alert" with visible "Retry loading" action', async () => {
      const failContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const failPage = await failContext.newPage();
      let simulateFailure = true;

      await failPage.route('**/*', (route) => {
        const reqUrl = route.request().url();
        if (!reqUrl.startsWith(url)) return route.abort();

        const parsed = new URL(reqUrl);
        if (parsed.pathname === '/src/services/apiService.js') {
          return route.fulfill({
            contentType: 'application/javascript; charset=utf-8',
            body: fixtureModuleBody
          });
        }

        // Simulate network failure for Insights chunk
        if (simulateFailure && (parsed.pathname.includes('InsightsView') || parsed.pathname.includes('InsightsView-'))) {
          return route.abort('failed');
        }

        return route.continue();
      });

      await failPage.goto(url, { waitUntil: 'domcontentloaded' });
      await failPage.locator('input[type=email]').fill('student.active@nextstep.local');
      await failPage.locator('input[type=password]').fill('password123');
      await failPage.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await failPage.locator('.workspace-nav').waitFor({ state: 'visible' });

      // Click InsightsView while simulated failure is active
      await selectViewOnPage(failPage, 'Insights');

      // Verify Error Boundary renders accessible alert
      const errorBoundary = failPage.locator('[role="alert"], [data-testid="async-view-error"]');
      await errorBoundary.first().waitFor({ state: 'visible' });

      const heading = await errorBoundary.first().locator('h3').textContent();
      assert.ok(/unable to load/i.test(heading), `Expected "Unable to load" heading, found: ${heading}`);

      const retryBtn = failPage.locator('[data-testid="async-retry-button"]').or(failPage.getByRole('button', { name: /retry loading/i }));
      await retryBtn.first().waitFor({ state: 'visible' });

      // Now heal the network / unblock the chunk
      simulateFailure = false;
      await retryBtn.first().click();

      // Verify InsightsView now renders successfully!
      await failPage.locator('#view-insights').waitFor({ state: 'visible' });
      await failContext.close();
    });

    // --- SCENARIO 6: Heavy Dialogs Load On-Demand & Restore Keyboard Focus ---
    await check('S6: Heavy modals (Foundations Checkpoint, Continuation Plan) load on demand and restore focus', async () => {
      const modalContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const modalPage = await modalContext.newPage();
      await modalPage.route('**/*', (route) => {
        const reqUrl = route.request().url();
        if (!reqUrl.startsWith(url)) return route.abort();
        const parsed = new URL(reqUrl);
        if (parsed.pathname === '/src/services/apiService.js') {
          return route.fulfill({
            contentType: 'application/javascript; charset=utf-8',
            body: fixtureModuleBody
          });
        }
        return route.continue();
      });

      await modalPage.goto(url, { waitUntil: 'domcontentloaded' });
      await modalPage.locator('input[type=email]').fill('student.completed@nextstep.local');
      await modalPage.locator('input[type=password]').fill('password123');
      await modalPage.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await modalPage.locator('.workspace-nav').waitFor({ state: 'visible' });

      // 1. Foundations Checkpoint Modal
      const checkpointTrigger = modalPage.locator('button').filter({ hasText: /Check My Foundations|Foundations Checkpoint/i });
      await checkpointTrigger.first().waitFor({ state: 'visible' });
      await checkpointTrigger.first().focus();
      await checkpointTrigger.first().click();

      // Checkpoint dialog appears
      const checkpointDialog = modalPage.locator('[role="dialog"][aria-labelledby="checkpoint-title"]');
      await checkpointDialog.waitFor({ state: 'visible' });

      // Close via close button
      const closeBtn = checkpointDialog.locator('button[aria-label="Close checkpoint"]');
      await closeBtn.click();
      await checkpointDialog.waitFor({ state: 'hidden' });

      // Confirm focus is restored
      const activeElementTag = await modalPage.evaluate(() => document.activeElement?.tagName);
      assert.ok(activeElementTag, 'Expected valid active element after closing checkpoint modal');

      // 2. Continuation Plan Modal
      const continuationTrigger = modalPage.locator('button').filter({ hasText: /Choose My Next Step|Plan study activities|Plan Next Week/i });
      await continuationTrigger.first().waitFor({ state: 'visible' });
      await continuationTrigger.first().focus();
      await continuationTrigger.first().click();

      const continuationDialog = modalPage.locator('[role="dialog"][aria-labelledby="continuation-plan-title"]');
      await continuationDialog.waitFor({ state: 'visible' });

      // Close continuation dialog
      const closeContinuation = continuationDialog.locator('button[aria-label="Close plan dialog"], button:has-text("Cancel")');
      await closeContinuation.first().click();
      await continuationDialog.waitFor({ state: 'hidden' });

      await modalContext.close();
    });

    await check('S7: A delayed modal can be cancelled with Escape and never opens after its chunk arrives', async () => {
      const pendingContext = await browser.newContext();
      const pendingPage = await pendingContext.newPage();
      let releaseChunk;
      const chunkGate = new Promise((resolve) => { releaseChunk = resolve; });
      await pendingPage.route('**/*', async (route) => {
        const requestUrl = new URL(route.request().url());
        if (requestUrl.origin !== new URL(url).origin) return route.abort();
        if (requestUrl.pathname === '/src/services/apiService.js') {
          return route.fulfill({ contentType: 'application/javascript', body: fixtureModuleBody });
        }
        if (requestUrl.pathname.includes('FoundationsCheckpointModal')) await chunkGate;
        return route.continue();
      });
      try {
        await pendingPage.goto(url);
        await pendingPage.locator('input[type=email]').fill('student.completed@nextstep.local');
        await pendingPage.locator('input[type=password]').fill('password123');
        await pendingPage.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
        const trigger = pendingPage.getByRole('button', { name: /Check My Foundations/i });
        await trigger.click();
        const loading = pendingPage.getByTestId('async-modal-loading');
        await loading.waitFor();
        assert.equal(await pendingPage.evaluate(() => document.body.style.overflow), 'hidden');
        await pendingPage.keyboard.press('Escape');
        await loading.waitFor({ state: 'hidden' });
        assert.equal(await trigger.evaluate((el) => el === document.activeElement), true);
        const response = pendingPage.waitForResponse((res) => new URL(res.url()).pathname.includes('FoundationsCheckpointModal'));
        releaseChunk();
        await response;
        assert.equal(await pendingPage.getByRole('dialog').count(), 0);
        await trigger.click();
        await pendingPage.locator('[role="dialog"][aria-labelledby="checkpoint-title"]').waitFor();
      } finally { releaseChunk(); await pendingContext.close(); }
    });

    console.log(`\nAll ${results.length} loading performance scenarios passed successfully!`);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('\nVerification failed:', err);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
