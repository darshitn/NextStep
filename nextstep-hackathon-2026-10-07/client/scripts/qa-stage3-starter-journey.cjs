const { chromium } = require('D:/Projects/Deadline-Catcher/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const EVIDENCE_DIR = path.resolve(__dirname, '../.local/full-local-qa/2026-10-21T11-48-00Z/stage3');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const BASE_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';

(async () => {
  console.log('====================================================');
  console.log('STAGE 3: COMPLETE ALL 12 STARTER MILESTONES (M01-M12)');
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
    // STEP 1: Sign in with fresh synthetic student & Onboarding
    // ----------------------------------------------------
    const freshEmail = `student.starter_${Date.now()}@nextstep.local`;
    console.log(`--- Step 1: Initializing fresh student goal (${freshEmail}) ---`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', freshEmail);
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL('**/onboarding', { timeout: 8000 });
    assert.ok(page.url().includes('/onboarding'), 'Must route to onboarding');

    await page.fill('input#goal-name', 'DSA Foundations Mastery (M01-M12 Journey)');
    const presetBtn = await page.waitForSelector('button:has-text("Weekdays · 60 min/day")');
    await presetBtn.click();
    await page.waitForTimeout(200);

    const submitGoalBtn = await page.waitForSelector('button[type="submit"]:has-text("Generate Practice Plan")');
    await submitGoalBtn.click();
    await page.waitForURL('**/dashboard', { timeout: 8000 });
    recordPass('M-INIT: Fresh goal created and routed to dashboard');

    // ----------------------------------------------------
    // STEP 2: Exercise Focus Timer Controls
    // ----------------------------------------------------
    console.log('--- Step 2: Testing Focus Timer controls ---');
    const preset15Btn = await page.waitForSelector('button:has-text("15m")');
    await preset15Btn.click();
    await page.waitForTimeout(200);

    const startTimerBtn = await page.waitForSelector('button:has-text("Start focus session")');
    await startTimerBtn.click();
    await page.waitForTimeout(1200); // Wait 1.2s so at least 1 second has elapsed

    const pauseTimerBtn = await page.waitForSelector('button[aria-label="Pause focus timer"]');
    await pauseTimerBtn.click();
    await page.waitForTimeout(300);

    const resumeTimerBtn = await page.waitForSelector('button[aria-label="Resume focus timer"]');
    assert.ok(resumeTimerBtn, 'Resume button must appear when timer is paused');
    await resumeTimerBtn.click();
    await page.waitForTimeout(300);

    const resetTimerBtn = await page.waitForSelector('button[aria-label="Reset focus timer"]');
    await resetTimerBtn.click();
    await page.waitForTimeout(200);

    const startAfterResetBtn = await page.waitForSelector('button:has-text("Start focus session")');
    assert.ok(startAfterResetBtn, 'Start session button should re-appear after reset');
    recordPass('TIMER-01..05: Focus timer preset, start, pause, resume and reset verified');

    // ----------------------------------------------------
    // STEP 3: Complete M01 through M12 Sequentially
    // ----------------------------------------------------
    console.log('--- Step 3: Executing M01 through M12 UI journey ---');

    for (let m = 1; m <= 12; m++) {
      const missionId = `m${String(m).padStart(2, '0')}`;
      const upperMissionId = missionId.toUpperCase();
      console.log(`\nExecuting Mission ${upperMissionId}...`);

      // 1. Verify Current Mission Card on Today view
      const missionLabelEl = await page.waitForSelector('.mission-topline .section-label, .mission-card h2', { timeout: 6000 });
      const currentMissionText = await page.textContent('.mission-card');
      assert.ok(currentMissionText.includes(upperMissionId), `Mission card must display ${upperMissionId}`);

      // 2. Open Guidance for curated missions (M02, M04, M06)
      if (['m02', 'm04', 'm06'].includes(missionId)) {
        const startPracticeBtn = await page.$('button#start-current-practice');
        if (startPracticeBtn) {
          await startPracticeBtn.click();
          await page.waitForTimeout(400);

          // Verify Practice workspace renders
          const guidancePanel = await page.waitForSelector('.practice-workspace', { timeout: 4000 });
          assert.ok(guidancePanel, `Practice workspace should render for ${upperMissionId}`);

          // Close guidance panel
          const closeGuidanceBtn = await page.$('button[aria-label="Close practice panel"]');
          if (closeGuidanceBtn) {
            await closeGuidanceBtn.click();
            await page.waitForTimeout(300);
          }
        }
      }

      // 3. Click Record completion
      const recordBtn = await page.waitForSelector('.mission-actions button:has-text("Record completion")');
      await recordBtn.click();
      await page.waitForTimeout(400);

      // 4. In Completion Modal, choose outcome & fill reflection
      const modal = await page.waitForSelector('.completion-dialog, [role="dialog"][aria-labelledby="completion-heading"]');
      assert.ok(modal, 'Completion modal must open');

      const outcome = (m % 2 === 1) ? 'independent' : 'with_hint';
      const outcomeRadio = await page.waitForSelector(`input[type="radio"][value="${outcome}"]`);
      await outcomeRadio.click();

      const reflectionText = `Mission ${upperMissionId}: Verified two-pointer boundaries, loop invariant, and O(1) space constraints.`;
      const reflectionTextarea = await page.waitForSelector('textarea#completion-reflection');
      await reflectionTextarea.fill(reflectionText);

      // Submit completion
      const submitCompletionBtn = await page.waitForSelector('button[type="submit"]:has-text("Record practice")');
      await submitCompletionBtn.click();
      await page.waitForTimeout(800);

      recordPass(`MISSION-${upperMissionId}: Completed with outcome=${outcome} and reflection recorded`);

      // 5. Checkpoints at M03, M06, M09: Reload page, verify persistence, inspect Starter track
      if ([3, 6, 9].includes(m)) {
        console.log(`Checking persistence and Roadmap view after ${upperMissionId}...`);
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Verify next mission is active on Today
        const nextExpectedId = `M${String(m + 1).padStart(2, '0')}`;
        const reloadedCardText = await page.textContent('.mission-card');
        assert.ok(reloadedCardText.includes(nextExpectedId), `Reload must persist progress; current should be ${nextExpectedId}`);

        // Navigate to Starter track view
        const roadmapNavBtn = await page.waitForSelector('#nav-roadmap');
        await roadmapNavBtn.click();
        await page.waitForTimeout(400);

        // Verify completed mission is marked Done in Roadmap view
        const roadmapText = await page.textContent('#view-roadmap');
        assert.ok(roadmapText.includes(upperMissionId) && roadmapText.includes('Done'), `Roadmap must list ${upperMissionId} as Done`);

        // Return to Today view
        const todayNavBtn = await page.waitForSelector('#nav-today');
        await todayNavBtn.click();
        await page.waitForTimeout(400);
        recordPass(`CHECKPOINT-${upperMissionId}: Reload persistence and Starter track reflection verified`);
      }
    }

    // ----------------------------------------------------
    // STEP 4: Verify Starter Track Completion State (12/12)
    // ----------------------------------------------------
    console.log('--- Step 4: Verifying final 12/12 starter completion state ---');
    await page.waitForTimeout(500);

    // Verify celebration badge / text
    const todayContent = await page.textContent('#view-today');
    assert.ok(todayContent.includes('Starter Track Completed') || todayContent.includes('12 of 12 Missions') || todayContent.includes('All starter missions completed'), '12/12 Starter Track completion banner must render');

    // Verify primary action card offers Foundations Checkpoint
    assert.ok(todayContent.includes('Foundations Checkpoint') || todayContent.includes('Check My Foundations'), 'Primary action card must recommend Check My Foundations');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09-starter-track-m12-completed.png') });

    // Inspect full Roadmap view
    const roadmapNavBtn = await page.waitForSelector('#nav-roadmap');
    await roadmapNavBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '10-roadmap-all-completed.png') });

    recordPass('M12-COMPLETION: All 12 starter missions completed, progress preserved, Check My Foundations unlocked');

  } catch (err) {
    recordFail('STAGE-3-JOURNEY', err);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`STAGE 3 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('====================================================');

  if (results.failed.length > 0) {
    process.exit(1);
  }
})();
