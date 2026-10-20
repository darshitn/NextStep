const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'D:/Projects/Deadline-Catcher/node_modules/playwright');
const url = process.argv[3] || 'http://127.0.0.1:5173';
const output = path.resolve(__dirname, '../.local/first-session-evidence');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const results = [];

  let authoritativeExercises = null;
  let authoritativeLessons = null;
  async function getAuthoritativeData() {
    if (!authoritativeExercises) {
      const curriculumPath = path.resolve(__dirname, '../../server/data/curriculum/index.js');
      const { RAW_CURRICULUM_DATA } = await import(`file://${curriculumPath.replace(/\\/g, '/')}`);
      authoritativeExercises = RAW_CURRICULUM_DATA.exercises;
      authoritativeLessons = RAW_CURRICULUM_DATA.lessons;
    }
    return { exercises: authoritativeExercises, lessons: authoritativeLessons };
  }

  const check = async (name, run) => {
    await run();
    results.push(name);
    console.log('PASS: ' + name);
  };

  try {
    await fs.mkdir(output, { recursive: true });

    // Mock apiService to route through apiFixture with demo accounts
    await page.route('**/*', (route) => {
      const request = new URL(route.request().url());
      if (request.origin !== new URL(url).origin) return route.abort();
      if (request.pathname === '/src/services/apiService.js') {
        return route.fulfill({
          contentType: 'application/javascript',
          body: `import { apiFixture, DEMO_ACCOUNTS } from '/src/fixtures/apiFixture.js';
export const isFixtureMode = true;
export const onSessionExpired = () => () => {};
export const apiService = { ...apiFixture, demoAccounts: DEMO_ACCOUNTS,
  saveExerciseAttempt: (...args) => {
    if (globalThis.__failFirstSessionSave) return Promise.reject(new Error('Synthetic save unavailable. Retry your attempt.'));
    return apiFixture.saveExerciseAttempt(...args);
  }
};`
        });
      }
      return route.continue();
    });

    // -------------------------------------------------------------------------
    // Scenario 1: New Student Today Journey & Prominent First-Lesson Invitation
    // -------------------------------------------------------------------------
    await check('S1: Prominent "Start your first lesson" invitation on Today for new students', async () => {
      await page.goto(url);
      await page.locator('input[type=email]').fill('student.firsttime@nextstep.local');
      await page.locator('input[type=password]').fill('password123');
      await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await page.locator('#view-today').waitFor();

      // 1. Verify First-Session Invitation card exists
      const firstSessionCard = page.locator('section[aria-label="First-time curriculum lesson invitation"]');
      await firstSessionCard.waitFor();

      // 2. Verify title, estimated minutes, and reason
      const cardText = await firstSessionCard.textContent();
      assert.ok(cardText.includes('Start your first lesson'), 'Must have heading "Start your first lesson"');
      assert.ok(cardText.includes('Single-Pass Loop Invariants & Running Extrema'), 'Must display recommended lesson title');
      assert.ok(cardText.includes('15 mins'), 'Must display estimated minutes');
      assert.ok(cardText.includes('zero unmet prerequisites'), 'Must explain suitability');

      // 3. Verify track separation explanation
      assert.ok(cardText.includes('Two complementary learning tracks'), 'Must explain track separation');
      assert.ok(cardText.includes('12-mission Starter Track'), 'Must mention Starter Track');
      assert.ok(cardText.includes('Curriculum Path'), 'Must mention Curriculum Path');

      // 4. Verify alternative navigation remains available (starter mission card below)
      const missionCard = page.locator('.mission-card');
      await missionCard.waitFor();
      assert.ok(await missionCard.isVisible(), 'Starter MissionCard must remain accessible');

      await page.screenshot({ path: path.join(output, 'first-session-today-1440.png'), fullPage: true });

      // 5. Click "Start your first lesson" button and verify deep-link to Proof Studio
      const startBtn = firstSessionCard.getByRole('button', { name: /Start your first lesson/i });
      await startBtn.click();
      await page.locator('#view-proof').waitFor();

      // Verify active lesson is les_arrays_01
      const lessonHeading = await page.locator('#proof-heading').textContent();
      assert.ok(lessonHeading.includes('Single-Pass Loop Invariants & Running Extrema'), 'Navigated to recommended lesson');
    });

    // -------------------------------------------------------------------------
    // Scenario 2: Traced Lesson Learning Loop Guide & Disabled Save Jump Action
    // -------------------------------------------------------------------------
    await check('S2: Proof Learning Loop Guide (Understand -> Predict -> Check -> Save) and Jump Action', async () => {
      const { exercises } = await getAuthoritativeData();
      const authoredEx = exercises.find((e) => e.id === 'ex_arrays_01');
      assert.ok(authoredEx, 'ex_arrays_01 must exist');

      // 1. Verify Learning Loop Guide exists with 4 steps
      const guide = page.locator('section[aria-label="Proof learning loop progress guide"]');
      await guide.waitFor();
      const guideText = await guide.textContent();
      assert.ok(guideText.includes('Learn → Try → Check → Finish') || guideText.includes('Understand → Predict → Check → Save'), 'Header must show 4-step loop');
      assert.ok(guideText.includes('1. Learn') || guideText.includes('1. Understand'), 'Must have Step 1');
      assert.ok(guideText.includes('2. Try') || guideText.includes('2. Predict'), 'Must have Step 2');
      assert.ok(guideText.includes('3. Check'), 'Must have Step 3');
      assert.ok(guideText.includes('4. Finish') || guideText.includes('4. Save'), 'Must have Step 4');

      await page.screenshot({ path: path.join(output, 'first-session-proof-guide-1440.png'), fullPage: false });

      // 2. Click "Understand" in guide -> switches to Learn mode
      const understandBtn = guide.getByRole('button', { name: /(?:1\. Learn|1\. Understand)/i });
      await understandBtn.click();
      await page.getByRole('tab', { name: 'Learn', exact: true, selected: true }).waitFor();

      // 3. Click "Predict" in guide -> switches back to Trace mode
      const predictBtn = guide.getByRole('button', { name: /(?:2\. Try|2\. Predict)/i });
      await predictBtn.click();
      await page.getByRole('tab', { name: /^Trace/i, selected: true }).waitFor();
      await page.waitForFunction(() => document.activeElement?.closest('#trace-step-choices'));

      // 4. Verify disabled Save explanation at 0/3 verified steps
      const exerciseForm = page.locator('form').filter({ hasText: /Record Proof Trace Attempt/i });
      await exerciseForm.waitFor();
      const saveBtn = exerciseForm.getByRole('button', { name: 'Save Proof Attempt', exact: true });
      assert.equal(await saveBtn.isDisabled(), true, 'Save must be disabled initially');

      const disabledNotice = exerciseForm.locator('text=Verify 3 more trace steps and the boundary check to enable saving.');
      await disabledNotice.waitFor();

      // 5. Verify jump button "Go to Step 1"
      const jumpBtn = exerciseForm.locator('#jump-to-requirement-btn');
      await jumpBtn.waitFor();
      assert.equal((await jumpBtn.textContent()).trim(), 'Go to Step 1');

      // Click jump button: verifies focus reaches trace step choices
      await jumpBtn.click();

      // 6. Test check-in selection does NOT enable save
      const confRadios = exerciseForm.getByRole('radiogroup', { name: 'How did this feel?' });
      await confRadios.waitFor();
      const readyRadio = confRadios.getByRole('radio', { name: 'Ready to apply it' });
      await readyRadio.click();
      assert.equal(await saveBtn.isDisabled(), true, 'Check-in selection must not grant save eligibility');

      // 7. Answer Step 1 correctly
      const step0Choice = authoredEx.primaryVariant.steps[0].choices.find((c) => c.isCorrect);
      const step0BtnPattern = new RegExp(step0Choice.label.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await page.locator('#trace-step-choices').getByRole('button', { name: step0BtnPattern }).click();

      // Verify remaining explanation updates to 2 more trace steps (exact user prompt example)
      await exerciseForm.locator('text=Verify 2 more trace steps and the boundary check to enable saving.').waitFor();
      assert.equal((await jumpBtn.textContent()).trim(), 'Go to Step 2');

      // Advance to step 2 and answer it
      await page.getByRole('button', { name: /Advance to Step 2/i }).click();
      const step1Choice = authoredEx.primaryVariant.steps[1].choices.find((c) => c.isCorrect);
      const step1BtnPattern = new RegExp(step1Choice.label.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await page.locator('#trace-step-choices').getByRole('button', { name: step1BtnPattern }).click();

      // Advance to step 3 and answer it
      await page.getByRole('button', { name: /Advance to Step 3/i }).click();
      const step2Choice = authoredEx.primaryVariant.steps[2].choices.find((c) => c.isCorrect);
      const step2BtnPattern = new RegExp(step2Choice.label.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await page.locator('#trace-step-choices').getByRole('button', { name: step2BtnPattern }).click();

      // At 3/3 verified steps but edge unverified:
      await exerciseForm.locator('text=Verify the boundary check to enable saving.').waitFor();
      assert.equal((await jumpBtn.textContent()).trim(), 'Jump to boundary check');
      assert.equal(await saveBtn.isDisabled(), true, 'Save must remain disabled before boundary check');

      // Click jump button: focuses boundary check
      await jumpBtn.click();

      // Answer boundary check correctly
      const edgeChoice = authoredEx.edgeCaseCheck.choices.find((c) => c.isCorrect);
      const edgePattern = new RegExp(edgeChoice.label.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await page.locator('#boundary-check-section').getByRole('button', { name: edgePattern }).click();

      // Save button ENABLES!
      await saveBtn.waitFor();
      await page.waitForFunction((button) => !button.disabled, await saveBtn.elementHandle());
      assert.equal(await saveBtn.isEnabled(), true, 'Save Proof Attempt must enable after all steps and boundary pass');
    });

    // -------------------------------------------------------------------------
    // Scenario 3: Truthful Save Confirmation & Contextual Next Action
    // -------------------------------------------------------------------------
    await check('S3: Truthful Save Confirmation, Lesson Incomplete Distinction, and Next Action', async () => {
      const exerciseForm = page.locator('form').filter({ hasText: /Record Proof Trace Attempt/i });
      const saveBtn = exerciseForm.getByRole('button', { name: 'Save Proof Attempt', exact: true });

      // A failed save must preserve verified answers and self-report choices for retry.
      await page.evaluate(() => { globalThis.__failFirstSessionSave = true; });
      await saveBtn.click();
      await exerciseForm.getByRole('alert').filter({ hasText: 'Synthetic save unavailable' }).waitFor();
      assert.equal(await saveBtn.isEnabled(), true);
      assert.equal(await exerciseForm.getByRole('radio', { name: 'Ready to apply it', exact: true }).getAttribute('aria-checked'), 'true');
      await page.evaluate(() => { globalThis.__failFirstSessionSave = false; });
      // Explicit retry succeeds using the preserved answers.
      await saveBtn.click();

      // 1. Verify Truthful Confirmation Banner
      const confirmBanner = exerciseForm.locator('div[role="status"]').filter({ hasText: /Proof Trace Attempt Recorded/i });
      await confirmBanner.waitFor();
      const bannerText = await confirmBanner.textContent();
      assert.ok(bannerText.includes('Proof Trace Attempt Recorded'), 'Must confirm attempt recorded');
      assert.ok(bannerText.includes('Server recorded your verified trace steps and boundary check'), 'Must confirm server authority');
      assert.ok(bannerText.includes('Attempt saved · Lesson still in progress'), 'Must distinguish trace attempt from lesson completion');
      assert.ok(bannerText.includes('Recording this trace attempt saves your step proofs, but does not complete the lesson'), 'Must explain lesson completion requirement');

      // 2. Verify Contextual Next Action button
      const nextActionBtn = confirmBanner.getByRole('button', { name: /Complete Lesson Invariant Check/i });
      await nextActionBtn.waitFor();

      await page.screenshot({ path: path.join(output, 'first-session-saved-banner-1440.png'), fullPage: false });

      // 3. Click Next Action button -> scrolls to Lesson Invariant Check
      await nextActionBtn.click();
      const kcHeading = page.locator('#lesson-invariant-check-heading');
      await kcHeading.waitFor();
      await page.waitForFunction(() => document.activeElement?.closest('[role="radiogroup"][aria-label="Lesson invariant check"]'));
      await page.getByRole('button', { name: /^Try Alternate Input/ }).click();
      assert.equal(await confirmBanner.count(), 0, 'Primary save banner must not leak to alternate input');
      assert.equal(await page.locator('.learning-loop-guide').getByText('Saved', { exact: true }).count(), 0);
      await page.getByRole('button', { name: /^Back to Primary Input/ }).click();
      await confirmBanner.waitFor();
    });

    // -------------------------------------------------------------------------
    // Scenario 4: Established Student Retention on Today
    // -------------------------------------------------------------------------
    await check('S4: Established student no longer sees the first-session invitation on Today', async () => {
      // Navigate to Today
      await page.goto(`${url}/dashboard?view=today`);
      await page.locator('#view-today').waitFor();

      // First-Session invitation MUST NOT be rendered since student recorded curriculum activity
      const firstSessionCard = page.locator('section[aria-label="First-time curriculum lesson invitation"]');
      assert.equal(await firstSessionCard.count(), 0, 'First-session card must be absent after saving curriculum attempt');

      // Also verify established student.active with historical progress retains Today view without invitation
      await page.getByRole('button', { name: 'Sign out' }).click();
      await page.locator('input[type=email]').waitFor();
      await page.locator('input[type=email]').fill('student.active@nextstep.local');
      await page.locator('input[type=password]').fill('password123');
      await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
      await page.locator('#view-today').waitFor();
      assert.equal(await firstSessionCard.count(), 0, 'First-session card must be absent for existing active student');

      // Existing workspace recommendation card remains present
      const railCard = page.locator('[aria-label="Atlas and Proof recommended next step"]');
      await railCard.waitFor();
      assert.ok(await railCard.isVisible(), 'Rail recommendation remains available');

      await page.screenshot({ path: path.join(output, 'first-session-established-today-1440.png'), fullPage: true });
    });

    // -------------------------------------------------------------------------
    // Scenario 5: Exercise-Free Lesson Adaptation & State Isolation
    // -------------------------------------------------------------------------
    await check('S5: Exercise-Free lesson adapts guide to 3 steps (Understand -> Check -> Save) without leakage', async () => {
      await page.goto(`${url}/dashboard?view=proof`);
      await page.locator('#view-proof').waitFor();

      // Select Arrays topic and Lesson 3 (les_arrays_03 - an exercise-free lesson)
      await page.locator('#proof-topic-select').selectOption('topic_arrays');
      await page.locator('#proof-lesson-select').selectOption('les_arrays_03');

      // 1. Verify Learning Loop Guide adapts to 3 steps
      const guide = page.locator('section[aria-label="Proof learning loop progress guide"]');
      await guide.waitFor();
      const guideText = await guide.textContent();
      assert.ok(guideText.includes('Understand → Check → Save') || guideText.includes('Learn → Check → Finish'), 'Header must show 3-step loop for exercise-free lesson');
      assert.ok(guideText.includes('1. Understand') || guideText.includes('1. Learn'), 'Must have Step 1');
      assert.ok(guideText.includes('2. Check'), 'Must have Step 2');
      assert.ok(guideText.includes('3. Save') || guideText.includes('3. Finish'), 'Must have Step 3');
      assert.ok(!guideText.includes('2. Predict') && !guideText.includes('2. Try'), 'Must NOT have Predict step in exercise-free lesson');

      // 2. Verify trace notice explains no interactive trace attached
      await page.getByText(/No Interactive Proof Trace Attached to this Lesson/i).waitFor();

      // 3. Verify no trace form or leaked answers from les_arrays_01
      const traceChoices = page.locator('#trace-step-choices');
      assert.equal(await traceChoices.count(), 0, 'No trace choices on exercise-free lesson');

      await guide.getByRole('button', { name: /(?:1\. Understand|1\. Learn)/ }).click();
      await guide.getByRole('button', { name: /2\. Check/ }).click();
      await page.getByRole('tab', { name: 'Learn', exact: true, selected: true }).waitFor();
      await page.waitForFunction(() => document.activeElement?.closest('[role="radiogroup"][aria-label="Lesson invariant check"]'));
      await page.locator('#proof-lesson-select').focus();
      await page.locator('#proof-lesson-select').selectOption('les_arrays_04');
      await page.locator('#proof-lesson-select').selectOption('les_arrays_03');
      assert.ok(await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(document.activeElement?.id === 'proof-lesson-select'))))), 'Consumed guide navigation must not steal focus when returning to a lesson');

      await page.screenshot({ path: path.join(output, 'first-session-exercise-free-1440.png'), fullPage: false });
    });

    // -------------------------------------------------------------------------
    // Scenario 6: Multi-Viewport & Responsive Layout Checks (1440, 1024, 390, 320)
    // -------------------------------------------------------------------------
    await check('S6: Responsive layout across viewports (1440, 1024, 390, 320) with zero page errors', async () => {
      const viewports = [
        { width: 1024, height: 768, name: '1024' },
        { width: 390, height: 844, name: '390' },
        { width: 320, height: 568, name: '320' }
      ];

      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Check Today on mobile
        await page.goto(`${url}/dashboard?view=today`);
        await page.locator('#view-today').waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `Today overflow at ${vp.width}`);
        await page.screenshot({ path: path.join(output, `first-session-today-${vp.name}.png`), fullPage: false });

        // Check Proof on mobile
        await page.goto(`${url}/dashboard?view=proof`);
        await page.locator('#view-proof').waitFor();
        const guide = page.locator('section[aria-label="Proof learning loop progress guide"]');
        await guide.waitFor();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `Proof overflow at ${vp.width}`);
        assert.ok(await guide.isVisible(), `Guide must be visible on ${vp.width}px`);
        await page.screenshot({ path: path.join(output, `first-session-proof-guide-${vp.name}.png`), fullPage: false });
      }

      // Check for zero uncaught errors
      assert.equal(errors.length, 0, `Uncaught page errors detected: ${errors.join(', ')}`);
    });

    console.log(`\nALL ${results.length} FIRST-SESSION BROWSER SCENARIOS PASSED WITH ZERO UNCAUGHT ERRORS.\n`);
  } catch (err) {
    console.error('FAILED in verify-first-session:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
