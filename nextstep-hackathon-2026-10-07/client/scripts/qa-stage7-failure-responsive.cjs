const { chromium } = require('D:/Projects/Deadline-Catcher/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const EVIDENCE_DIR = path.resolve(__dirname, '../.local/full-local-qa/2026-10-21T11-48-00Z/stage7');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const BASE_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';

const VIEWPORTS = [
  { name: '1440-desktop', width: 1440, height: 900 },
  { name: '1024-tablet', width: 1024, height: 768 },
  { name: '390-mobile', width: 390, height: 844 },
  { name: '320-narrow', width: 320, height: 568 }
];

const VIEWS = [
  { id: 'today', name: 'Today' },
  { id: 'atlas', name: 'Learning Path' },
  { id: 'proof', name: 'Learn & Practise' },
  { id: 'practice', name: 'Practice Library' },
  { id: 'review', name: 'Review Queue' },
  { id: 'insights', name: 'Progress Insights' },
  { id: 'week', name: 'My Week' }
];

(async () => {
  console.log('====================================================');
  console.log('STAGE 7: FAILURE INJECTION & RESPONSIVE USABILITY');
  console.log('====================================================');

  const browser = await chromium.launch({ headless: true });
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
    // PART A: Responsive Geometry & Zero Horizontal Overflow Audit
    // ----------------------------------------------------
    console.log('\n--- Part A: Responsive Geometry (1440, 1024, 390, 320) ---');
    for (const vp of VIEWPORTS) {
      console.log(`Testing viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      // Sign in
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.fill('#signin-email', 'student.completed@nextstep.local');
      await page.fill('#signin-password', 'password123');
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForURL('**/dashboard');

      for (const v of VIEWS) {
        await page.goto(`${BASE_URL}/dashboard?view=${v.id}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);

        // Verify zero horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.equal(
          overflow,
          false,
          `Horizontal overflow detected on ${v.name} at ${vp.name}: scrollWidth=${scrollWidth} > innerWidth=${vp.width}`
        );
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, `01-responsive-${vp.name}.png`) });
      await context.close();
      recordPass(`RESPONSIVE-${vp.name}: 7 views validated with zero horizontal overflow (scrollWidth <= innerWidth)`);
    }

    // ----------------------------------------------------
    // PART B: Failure Injection — 409 Version Conflict & Input Preservation
    // ----------------------------------------------------
    console.log('\n--- Part B: Failure Injection (409 Conflict & Input Preservation) ---');
    const failContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const failPage = await failContext.newPage();

    await failPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await failPage.fill('#signin-email', 'student.completed@nextstep.local');
    await failPage.fill('#signin-password', 'password123');
    await failPage.click('button[type="submit"]:has-text("Sign In")');
    await failPage.waitForURL('**/dashboard');

    // Click "Name my goal"
    const nameGoalBtn = await failPage.waitForSelector('button:has-text("Name my goal")');
    await nameGoalBtn.click();
    await failPage.waitForTimeout(300);

    const goalNameInput = await failPage.waitForSelector('input#rename-goal');
    const newDraftName = 'Mastering Distributed State Invariants';
    await goalNameInput.fill(newDraftName);

    // INJECT CONFLICT: simulate concurrent device update by incrementing version in localStorage
    await failPage.evaluate(() => {
      const allKeys = Object.keys(localStorage);
      const goalKey = allKeys.find((k) => k.startsWith('nextstep_fixture_goal_') || k.startsWith('nextstep_synthetic_goal_') || k.startsWith('nextstep_goal_'));
      if (goalKey) {
        const raw = JSON.parse(localStorage.getItem(goalKey));
        raw.version = (raw.version || 1) + 50;
        localStorage.setItem(goalKey, JSON.stringify(raw));
      } else {
        throw new Error('No goal key found in localStorage. Keys: ' + JSON.stringify(allKeys));
      }
    });

    // Attempt save with now-stale version
    const saveGoalBtn = await failPage.waitForSelector('button[type="submit"]:has-text("Save goal name")');
    await saveGoalBtn.click();
    await failPage.waitForTimeout(600);

    // Verify 409 conflict alert displays
    const errorAlert = await failPage.waitForSelector('div[role="alert"]', { timeout: 5000 });
    assert.ok(errorAlert, 'ErrorNotice alert banner must display on conflict');
    const alertText = await errorAlert.textContent();
    assert.ok(
      alertText.includes('changed') || alertText.includes('conflict') || alertText.includes('another device'),
      `Alert text should describe version conflict: got "${alertText}"`
    );

    // Verify input value was preserved
    const currentInputValue = await failPage.inputValue('input#rename-goal');
    assert.equal(currentInputValue, newDraftName, 'Input draft name must be preserved after conflict error');

    // Click cancel to cleanly dismiss inline edit
    const cancelBtn = await failPage.waitForSelector('button:has-text("Cancel")');
    await cancelBtn.click();

    await failPage.screenshot({ path: path.join(EVIDENCE_DIR, '02-failure-conflict-recovery.png') });
    await failContext.close();
    recordPass('FAIL-01..03: 409 Version conflict caught gracefully, ErrorNotice displayed, and inputs preserved');

  } catch (err) {
    recordFail('STAGE-7-VERIFICATION', err);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`STAGE 7 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('====================================================');

  if (results.failed.length > 0) {
    process.exit(1);
  }
})();
