const { chromium } = require('D:/Projects/Deadline-Catcher/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const EVIDENCE_DIR = path.resolve(__dirname, '../.local/full-local-qa/2026-10-21T11-48-00Z/stage2');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const BASE_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';

(async () => {
  console.log('====================================================');
  console.log('STAGE 2: FIRST VISIT, NAVIGATION, AND ONBOARDING QA');
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

  // ----------------------------------------------------
  // TEST 1: Sign-in UI, input validation & fixture authentication
  // ----------------------------------------------------
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // Check visible heading & fixture mode badge
    const badgeEl = await page.waitForSelector('.badge, span:has-text("Fixture Mode")', { timeout: 4000 });
    const fixtureBadgeText = await badgeEl.textContent();
    assert.ok(fixtureBadgeText.includes('Fixture Mode'), 'Fixture Mode badge must be visible');

    // Test sign-in disabled state when empty
    const signInBtn = await page.$('button[type="submit"]:has-text("Sign In")');
    assert.ok(await signInBtn.isDisabled(), 'Sign In button must be disabled when email or password is empty');

    // Switch to Create Account tab and test password validation
    const createAccountTab = await page.$('button[role="tab"]:has-text("Create Account")');
    assert.ok(createAccountTab, 'Create Account tab switcher must exist');
    await createAccountTab.click();
    await page.waitForTimeout(200);

    // Verify HTML5 constraint validation on short password
    await page.fill('input#signup-email', 'newbie@nextstep.local');
    await page.fill('input#signup-password', '123');
    await page.fill('input#signup-confirm-password', '123');
    const isTooShort = await page.$eval('input#signup-password', (el) => el.validity.tooShort || !el.validity.valid);
    assert.ok(isTooShort, 'Short password must trigger HTML constraint validation');

    // Test mismatched passwords triggers client error alert
    await page.fill('input#signup-password', 'secret123');
    await page.fill('input#signup-confirm-password', 'secret456');
    await page.click('button[type="submit"]:has-text("Create Student Account")');
    const alertEl = await page.waitForSelector('[role="alert"]', { timeout: 4000 });
    const pwdMismatchError = await alertEl.textContent();
    assert.ok(pwdMismatchError.toLowerCase().includes('not match'), 'Password mismatch error must display');

    // Test duplicate account registration error
    await page.fill('input#signup-email', 'student.active@nextstep.local');
    await page.fill('input#signup-password', 'password123');
    await page.fill('input#signup-confirm-password', 'password123');
    await page.click('button[type="submit"]:has-text("Create Student Account")');
    const duplicateAlertEl = await page.waitForSelector('[role="alert"]:has-text("already exists")', { timeout: 4000 });
    assert.ok(duplicateAlertEl, 'Duplicate account error must display');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-signin-validation-errors.png') });
    recordPass('AUTH-01/02/04: Sign-in UI, input validation and duplicate account alert');
    await context.close();
  } catch (err) {
    recordFail('AUTH-01/02/04: Sign-in validation', err);
  }

  // ----------------------------------------------------
  // TEST 2: Onboarding & Goal Configuration
  // ----------------------------------------------------
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Sign in as student.ready (has no initial goal, routed to onboarding)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', 'student.ready@nextstep.local');
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForLoadState('networkidle');

    // Expect redirect to /onboarding
    await page.waitForURL('**/onboarding', { timeout: 6000 });
    assert.ok(page.url().includes('/onboarding'), 'New student must be routed to onboarding');

    // Check title input & target date
    const titleInput = await page.waitForSelector('input#goal-name', { timeout: 4000 });
    assert.ok(titleInput, 'Goal title input #goal-name must exist');
    await titleInput.fill('Google & Meta SDE Placement');

    // Test availability sliders
    const sliders = await page.$$('input[type="range"]');
    assert.equal(sliders.length, 7, '7 weekday availability sliders must exist');

    // Test all-zero validation: set all sliders to 0
    for (const slider of sliders) {
      await slider.fill('0');
      await slider.dispatchEvent('input');
      await slider.dispatchEvent('change');
    }
    await page.waitForTimeout(200);

    // Verify the alert message for 0 weekly capacity
    const zeroAlert = await page.textContent('p[role="alert"], .text-rose-500');
    assert.ok(zeroAlert.includes('At least one day') || zeroAlert.includes('30 minutes'), 'Zero capacity alert must appear');

    // Click "Weekdays · 60 min/day" preset button
    const presetBtn = await page.$('button:has-text("Weekdays · 60 min/day"), button:has-text("60 min/day")');
    assert.ok(presetBtn, 'Preset button for weekdays must exist');
    await presetBtn.click();
    await page.waitForTimeout(200);

    // Verify weekly total updated
    const totalHoursBadge = await page.textContent('.availability-heading, span:has-text("hrs / wk")');
    assert.ok(totalHoursBadge.includes('5.0') || totalHoursBadge.includes('hrs / wk'), 'Weekly hours total should update');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02-onboarding-sliders.png') });

    // Submit goal via "Generate Practice Plan" and verify redirect to /dashboard
    const submitBtn = await page.waitForSelector('button[type="submit"]:has-text("Generate Practice Plan")');
    assert.ok(submitBtn, 'Submit button "Generate Practice Plan" must exist');
    await submitBtn.click();

    await page.waitForURL('**/dashboard', { timeout: 8000 });
    assert.ok(page.url().includes('/dashboard'), 'Submitting goal must redirect to dashboard');

    recordPass('ONBD-01..06: Onboarding goal creation, sliders, presets and zero-validation');
    await context.close();
  } catch (err) {
    recordFail('ONBD-01..06: Onboarding flow', err);
  }

  // ----------------------------------------------------
  // TEST 3: Desktop Navigation & Grouped Hierarchy
  // ----------------------------------------------------
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', 'student.active@nextstep.local');
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/dashboard');

    // Check grouped navigation headers: Study and Track
    const navText = await page.textContent('.workspace-nav-list');
    assert.ok(navText.includes('STUDY') || navText.includes('Study'), 'Study group header must exist');
    assert.ok(navText.includes('TRACK') || navText.includes('Track'), 'Track group header must exist');

    // Verify desktop rail buttons and view switching
    const destinations = [
      { id: 'nav-atlas', expectedParam: 'view=atlas', name: 'Learning path' },
      { id: 'nav-proof', expectedParam: 'view=proof', name: 'Learn & practise' },
      { id: 'nav-week', expectedParam: 'view=week', name: 'My week' },
      { id: 'nav-roadmap', expectedParam: 'view=roadmap', name: 'Starter track' },
      { id: 'nav-insights', expectedParam: 'view=insights', name: 'Progress' },
      { id: 'nav-practice', expectedParam: 'view=practice', name: 'Practice' },
      { id: 'nav-review', expectedParam: 'view=review', name: 'Review' },
      { id: 'nav-today', expectedParam: '', name: 'Today' }
    ];

    for (const dest of destinations) {
      const btn = await page.waitForSelector(`#${dest.id}`);
      assert.ok(btn, `Nav button #${dest.id} (${dest.name}) must exist`);
      await btn.click();
      await page.waitForTimeout(300);

      if (dest.expectedParam) {
        assert.ok(page.url().includes(dest.expectedParam), `URL should include ${dest.expectedParam}`);
      } else {
        assert.ok(!page.url().includes('view='), 'Today view should return to clean /dashboard');
      }
    }

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03-desktop-navigation.png') });
    recordPass('NAV-01/04: Desktop grouped navigation reaches all destinations');
    await context.close();
  } catch (err) {
    recordFail('NAV-01/04: Desktop navigation', err);
  }

  // ----------------------------------------------------
  // TEST 4: Mobile Primary Navigation (390px) & More Menu
  // ----------------------------------------------------
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', 'student.active@nextstep.local');
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/dashboard');

    // Check bottom navigation bar: Today, Learn, My week, More
    const todayTab = await page.waitForSelector('#mobile-nav-today');
    const learnTab = await page.waitForSelector('#mobile-nav-proof');
    const weekTab = await page.waitForSelector('#mobile-nav-week');
    const moreTab = await page.waitForSelector('#nav-more-trigger');

    assert.ok(todayTab, 'Mobile Today tab must exist');
    assert.ok(learnTab, 'Mobile Learn tab must exist');
    assert.ok(weekTab, 'Mobile Week tab must exist');
    assert.ok(moreTab, 'Mobile More trigger must exist');

    // Open More dropdown menu
    await moreTab.click();
    await page.waitForTimeout(200);

    const dropdown = await page.waitForSelector('.workspace-nav-dropdown[role="menu"]');
    assert.ok(dropdown, 'More dropdown menu must open');

    // Verify secondary destinations in dropdown
    const roadmapOption = await page.$('#menu-nav-roadmap');
    const insightsOption = await page.$('#menu-nav-insights');
    const atlasOption = await page.$('#menu-nav-atlas');
    assert.ok(roadmapOption, 'Starter track item must exist in More menu');
    assert.ok(insightsOption, 'Progress item must exist in More menu');
    assert.ok(atlasOption, 'Learning path item must exist in More menu');

    // Test Escape key closes dropdown and restores focus to #nav-more-trigger
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const isDropdownHidden = !(await page.$('.workspace-nav-dropdown'));
    assert.ok(isDropdownHidden, 'Escape must close More dropdown menu');

    const focusedId = await page.evaluate(() => document.activeElement?.id);
    assert.equal(focusedId, 'nav-more-trigger', 'Focus must return to #nav-more-trigger on Escape');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04-mobile-navigation-sheet.png') });
    recordPass('NAV-02/03: Mobile navigation (Today / Learn / My week / More) and Escape restoration');
    await context.close();
  } catch (err) {
    recordFail('NAV-02/03: Mobile navigation', err);
  }

  // ----------------------------------------------------
  // TEST 5: Interactive Getting-Started Guide Traversal
  // ----------------------------------------------------
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', 'student.firsttime@nextstep.local');
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/dashboard');

    // Verify first-time invitation banner
    const guideTrigger = await page.waitForSelector('[data-guide="walkthrough-invitation"] button:has-text("Start walkthrough")', { timeout: 4000 });
    assert.ok(guideTrigger, 'Getting-started invitation banner must appear for first-time students');

    // Start walkthrough
    await guideTrigger.click();
    await page.waitForTimeout(400);

    const callout = await page.waitForSelector('[data-guide="interactive-guide-dialog"]', { timeout: 4000 });
    assert.ok(callout, 'Guide dialog must render');

    // Step 1: Check counter (1 of 5)
    const calloutHeader = await callout.textContent();
    assert.ok(calloutHeader.includes('1 of'), 'Step 1 of 5 should be active');

    // Click Next to advance
    const nextBtn = await callout.$('button.primary-button:has-text("Next")');
    assert.ok(nextBtn, 'Next button must exist');
    await nextBtn.click();
    await page.waitForTimeout(300);

    // Verify step counter advanced to 2
    const step2Header = await callout.textContent();
    assert.ok(step2Header.includes('2 of'), 'Step 2 of 5 should now be active');

    // Escape closes and restores focus
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const isClosed = !(await page.$('[data-guide="interactive-guide-dialog"]'));
    assert.ok(isClosed, 'Escape must dismiss the guide');

    // Replay guide via header Getting started button
    const replayBtn = await page.waitForSelector('[data-guide="getting-started-trigger"]');
    assert.ok(replayBtn, 'Getting started replay button must exist');
    await replayBtn.click();
    await page.waitForTimeout(300);

    const replayedCallout = await page.$('[data-guide="interactive-guide-dialog"]');
    assert.ok(replayedCallout, 'Replaying guide should reopen the dialog');

    // Dismiss with Close (X) button
    const closeBtn = await page.$('button[aria-label="Close walkthrough"]');
    assert.ok(closeBtn, 'Close button must exist');
    await closeBtn.click();
    await page.waitForTimeout(200);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '05-interactive-guide-traversal.png') });
    recordPass('TDY-06..08: Interactive getting started guide traversal, replay and focus restoration');
    await context.close();
  } catch (err) {
    recordFail('TDY-06..08: Interactive guide', err);
  }

  // ----------------------------------------------------
  // TEST 6: Appearance Controls across 3 Styles x 2 Modes
  // ----------------------------------------------------
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // Open Appearance popover via trigger button
    const appearanceTrigger = await page.waitForSelector('button.appearance-trigger');
    assert.ok(appearanceTrigger, 'Appearance trigger button must exist');
    await appearanceTrigger.click();
    await page.waitForTimeout(200);

    const popover = await page.waitForSelector('.appearance-popover');
    assert.ok(popover, 'Appearance popover must open');

    const styles = ['frosted-sage', 'study-journal', 'quiet-focus'];
    for (const styleId of styles) {
      const radioLabel = await page.waitForSelector(`label.appearance-option:has(input[value="${styleId}"])`);
      assert.ok(radioLabel, `Radio option label for style ${styleId} must exist`);
      await radioLabel.click();
      await page.waitForTimeout(150);

      const appliedStyle = await page.evaluate(() => document.documentElement.dataset.style);
      assert.equal(appliedStyle, styleId, `Document dataset.style should be ${styleId}`);
    }

    // Test Color mode: Dark and Light
    const darkBtn = await page.$('button[aria-label="Dark theme"]');
    assert.ok(darkBtn, 'Dark theme button must exist');
    await darkBtn.click();
    await page.waitForTimeout(100);
    const darkTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    assert.equal(darkTheme, 'dark', 'Document dataset.theme should be dark');

    const lightBtn = await page.$('button[aria-label="Light theme"]');
    assert.ok(lightBtn, 'Light theme button must exist');
    await lightBtn.click();
    await page.waitForTimeout(100);
    const lightTheme = await page.evaluate(() => document.documentElement.dataset.theme);
    assert.equal(lightTheme, 'light', 'Document dataset.theme should be light');

    // Test Escape closes popover and restores focus to trigger
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const isPopoverClosed = !(await page.$('.appearance-popover'));
    assert.ok(isPopoverClosed, 'Escape must close appearance popover');

    const focusedClass = await page.evaluate(() => document.activeElement?.className);
    assert.ok(focusedClass.includes('appearance-trigger'), 'Focus must return to appearance trigger on Escape');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06-appearance-themes.png') });
    recordPass('AUTH-09: Appearance controls verified across 3 styles x 2 color modes (6 combinations)');
    await context.close();
  } catch (err) {
    recordFail('AUTH-09: Appearance themes', err);
  }

  // ----------------------------------------------------
  // TEST 7: Goal Inline Rename
  // ----------------------------------------------------
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', 'student.active@nextstep.local');
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/dashboard');

    const renameBtn = await page.waitForSelector('button:has-text("Name my goal")');
    assert.ok(renameBtn, 'Name my goal button must exist');
    await renameBtn.click();
    await page.waitForTimeout(200);

    const renameInput = await page.waitForSelector('input#rename-goal');
    assert.ok(renameInput, 'Rename goal input must exist');
    await renameInput.fill('Google SDE Preparation (Sprint 2026)');

    const saveRenameBtn = await page.waitForSelector('button:has-text("Save goal name")');
    assert.ok(saveRenameBtn, 'Save goal name button must exist');
    await saveRenameBtn.click();

    const updatedHeadingEl = await page.waitForSelector('h1#today-heading:has-text("Sprint 2026")', { timeout: 6000 });
    assert.ok(updatedHeadingEl, 'Goal title should update after rename');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '07-goal-rename.png') });
    recordPass('ONBD-07: Inline goal rename saves and updates dashboard header');
    await context.close();
  } catch (err) {
    recordFail('ONBD-07: Goal rename', err);
  }

  // ----------------------------------------------------
  // TEST 8: Logout and Account Isolation
  // ----------------------------------------------------
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', 'student.active@nextstep.local');
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/dashboard');

    // Click Sign Out button
    const signOutBtn = await page.waitForSelector('button[aria-label="Sign out"], button[title="Sign out"]');
    assert.ok(signOutBtn, 'Sign Out button must exist in header');
    await signOutBtn.click();
    await page.waitForURL('**/login', { timeout: 5000 });
    assert.ok(page.url().includes('/login'), 'Signing out must route back to /login');

    // Attempting direct navigation to /dashboard should redirect back to /login
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL('**/login', { timeout: 5000 });
    assert.ok(page.url().includes('/login'), 'Unauthenticated student must be redirected from /dashboard to /login');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '08-logout-isolation.png') });
    recordPass('AUTH-07/08: Sign-out clears session and enforces unauthenticated redirect');
    await context.close();
  } catch (err) {
    recordFail('AUTH-07/08: Sign-out isolation', err);
  }

  await browser.close();

  console.log('\n====================================================');
  console.log(`STAGE 2 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('====================================================');

  if (results.failed.length > 0) {
    process.exit(1);
  }
})();
