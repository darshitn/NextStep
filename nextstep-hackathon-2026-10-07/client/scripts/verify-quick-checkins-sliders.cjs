const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'D:/Projects/Deadline-Catcher/node_modules/playwright');
const url = process.argv[3] || 'http://127.0.0.1:5173';
const output = path.resolve(__dirname, '../.local/checkins-sliders-evidence');

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
  async function getAuthoritativeExercises() {
    if (!authoritativeExercises) {
      const curriculumPath = path.resolve(__dirname, '../../server/data/curriculum/index.js');
      const { RAW_CURRICULUM_DATA } = await import(`file://${curriculumPath.replace(/\\/g, '/')}`);
      authoritativeExercises = RAW_CURRICULUM_DATA.exercises;
    }
    return authoritativeExercises;
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
export const apiService = { ...apiFixture, demoAccounts: DEMO_ACCOUNTS };`
        });
      }
      return route.continue();
    });

    // 1. Sign in as active student
    await page.goto(url);
    await page.locator('input[type=email]').fill('student.active@nextstep.local');
    await page.locator('input[type=password]').fill('password123');
    await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
    await page.locator('.workspace-nav').waitFor();

    // -------------------------------------------------------------------------
    // TEST 1: Availability Sliders Interaction, Presets, Keyboard, and Zero-State
    // -------------------------------------------------------------------------
    await check('1. Availability sliders snap to 0/30/60/90, respond to keyboard/ticks/presets, and enforce non-zero validation', async () => {
      // Navigate to Week view and open replan/build modal (or check picker in Continuation/Plan modal)
      await page.goto(`${url}/dashboard?view=week`);
      await page.locator('#view-week').waitFor();

      // Open rebuild/replan modal to inspect AvailabilityPicker
      const replanBtn = page.getByRole('button', { name: /Replan Week|Build my week/i });
      if (await replanBtn.count() > 0) {
        await replanBtn.click();
      }

      const picker = page.locator('.availability-picker');
      await picker.waitFor();

      // Verify range sliders exist for all 7 days
      const sliders = picker.locator('input[type=range].availability-slider');
      assert.equal(await sliders.count(), 7, 'Must have 7 daily range sliders');

      // Test Monday slider
      const monSlider = picker.locator('input[aria-label="Monday study time"]');
      await monSlider.waitFor();
      assert.equal(await monSlider.getAttribute('min'), '0');
      assert.equal(await monSlider.getAttribute('max'), '90');
      assert.equal(await monSlider.getAttribute('step'), '30');

      // Test Quick Presets: "Weekdays · 30 min/day"
      const preset30Btn = picker.getByRole('button', { name: 'Weekdays · 30 min/day', exact: true });
      await preset30Btn.click();

      // Monday through Friday should now be 30, Saturday and Sunday 0
      assert.equal(await monSlider.inputValue(), '30');
      assert.equal(await monSlider.getAttribute('aria-valuetext'), '30 minutes');
      const satSlider = picker.locator('input[aria-label="Saturday study time"]');
      assert.equal(await satSlider.inputValue(), '0');
      assert.equal(await satSlider.getAttribute('aria-valuetext'), 'Rest day');

      // Verify weekly total: 5 * 30 = 150m = 2.5 hrs / wk
      await page.getByText('2.5 hrs / wk').waitFor();

      // Test Quick Presets: "Weekdays · 60 min/day"
      const preset60Btn = picker.getByRole('button', { name: 'Weekdays · 60 min/day', exact: true });
      await preset60Btn.click();
      assert.equal(await monSlider.inputValue(), '60');
      assert.equal(await monSlider.getAttribute('aria-valuetext'), '60 minutes');
      await page.getByText('5.0 hrs / wk').waitFor();

      // Test Keyboard Arrow navigation on Monday slider
      await monSlider.focus();
      await page.keyboard.press('ArrowRight'); // 60 -> 90
      assert.equal(await monSlider.inputValue(), '90');
      assert.equal(await monSlider.getAttribute('aria-valuetext'), '90 minutes');

      await page.keyboard.press('Home'); // -> 0
      assert.equal(await monSlider.inputValue(), '0');
      assert.equal(await monSlider.getAttribute('aria-valuetext'), 'Rest day');

      // Test Clickable Tick buttons (e.g. Monday: 60m)
      const tick60 = picker.getByRole('button', { name: 'Monday: 60 minutes', exact: true });
      await tick60.click();
      assert.equal(await monSlider.inputValue(), '60');

      // Test All-Zero validation: set all sliders to 0
      for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
        const tick0 = picker.getByRole('button', { name: `${day}: 0 minutes`, exact: true });
        await tick0.click();
      }
      assert.equal(await monSlider.inputValue(), '0');
      await page.getByRole('alert').filter({ hasText: /At least one day must have at least 30 minutes/i }).waitFor();

      // Restore to 60 min/day
      await preset60Btn.click();
      assert.equal(await page.locator('[role="alert"]').filter({ hasText: /At least one day must have/i }).count(), 0);

      // Close modal / cancel without applying
      const cancelBtn = page.getByRole('button', { name: /Cancel/i });
      if (await cancelBtn.count() > 0) {
        await cancelBtn.first().click();
      }
    });

    // -------------------------------------------------------------------------
    // TEST 2: Proof Check-Ins (Radio Selection, Disclosure, Persistence & Badges)
    // -------------------------------------------------------------------------
    await check('2. Proof Studio check-in radios work without typing, optional note opens, and self-reports persist', async () => {
      await page.goto(`${url}/dashboard?view=proof`);
      await page.locator('#view-proof').waitFor();

      // Select Arrays topic and Lesson 1 (les_arrays_01)
      await page.locator('#proof-topic-select').selectOption('topic_arrays');
      await page.locator('#proof-lesson-select').selectOption('les_arrays_01');
      await page.locator('#interactive-exercise-heading').waitFor();

      // 1. Check-in radios exist in exercise form
      const exerciseForm = page.locator('form').filter({ hasText: /Record Proof Trace Attempt/i });
      await exerciseForm.waitFor();

      const confRadios = exerciseForm.getByRole('radiogroup', { name: 'How did this feel?' });
      await confRadios.waitFor();

      const readyRadio = confRadios.getByRole('radio', { name: 'Ready to apply it' });
      const needsExampleRadio = confRadios.getByRole('radio', { name: 'I need another example' });
      await readyRadio.click();
      assert.equal(await readyRadio.getAttribute('aria-checked'), 'true');
      assert.equal(await needsExampleRadio.getAttribute('aria-checked'), 'false');

      const focusRadios = exerciseForm.getByRole('radiogroup', { name: 'What needs another look?' });
      const invariantRadio = focusRadios.getByRole('radio', { name: 'The invariant / tracked state' });
      await invariantRadio.click();
      assert.equal(await invariantRadio.getAttribute('aria-checked'), 'true');
      const saveAttemptBtn = exerciseForm.getByRole('button', { name: 'Save Proof Attempt', exact: true });
      assert.equal(await saveAttemptBtn.isDisabled(), true, 'Self-report choices alone must not enable Save at 0/3 verified steps');

      // 2. Optional note disclosure
      const noteDisclosure = exerciseForm.locator('details');
      const noteSummary = noteDisclosure.locator('summary');
      await noteSummary.click();
      const exTextarea = exerciseForm.locator('#proof-exercise-reflection');
      await exTextarea.waitFor({ state: 'visible' });
      await exTextarea.fill('Check-in test: minPrice updates after potential profit.');

      // Complete trace steps authoritatively to enable saving
      const exercises = await getAuthoritativeExercises();
      const authoredEx = exercises.find((e) => e.id === 'ex_arrays_01');
      assert.ok(authoredEx, 'ex_arrays_01 must exist in authoritative curriculum');

      for (let s = 0; s < 3; s += 1) {
        const stepChoice = authoredEx.primaryVariant.steps[s].choices.find((c) => c.isCorrect);
        const correctLabel = stepChoice.label;
        const buttonPattern = new RegExp(correctLabel.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        await page.getByRole('group', { name: 'Trace step choices', exact: true }).getByRole('button', { name: buttonPattern }).click();
        assert.equal(await saveAttemptBtn.isDisabled(), true, 'Save stays disabled until every step AND the boundary check are verified');
        if (s < 2) {
          await page.getByRole('button', { name: new RegExp(`Advance to Step ${s + 2}`) }).click();
        }
      }

      // Edge case check
      const edgeChoice = authoredEx.edgeCaseCheck.choices.find((c) => c.isCorrect);
      const edgeCorrectLabel = edgeChoice.label;
      const edgeButtonPattern = new RegExp(edgeCorrectLabel.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await page.getByRole('button', { name: edgeButtonPattern }).click();

      // 3. Save attempt and verify self-reported badge rendered
      await saveAttemptBtn.waitFor();
      await page.waitForFunction((button) => !button.disabled, await saveAttemptBtn.elementHandle());
      assert.equal(await saveAttemptBtn.isEnabled(), true, 'Save Proof Attempt should be enabled after completing trace');
      await saveAttemptBtn.click();
      await page.getByText(/Proof attempt saved/i).waitFor();

      // Verify labelled self-report badge appears
      await exerciseForm.getByText(/Reported: Ready to apply it/i).waitFor();
      await exerciseForm.getByText(/Focus: The invariant \/ tracked state/i).waitFor();

      // 4. Reload page and verify saved check-in choices survive
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('#view-proof').waitFor();
      await page.locator('#interactive-exercise-heading').waitFor();

      const reloadedForm = page.locator('form').filter({ hasText: /Record Proof Trace Attempt/i });
      await reloadedForm.getByText(/Reported: Ready to apply it/i).waitFor();

      // Saved primary answers must not preselect an alternate variant's self-report.
      await page.getByRole('button', { name: /^Try Alternate Input/ }).click();
      const alternateConfidence = reloadedForm.getByRole('radiogroup', { name: 'How did this feel?' });
      assert.equal(await alternateConfidence.locator('[aria-checked="true"]').count(), 0);
      const alternateNote = reloadedForm.locator('#proof-exercise-reflection');
      assert.equal(await alternateNote.inputValue(), '');
      const firstRadio = alternateConfidence.getByRole('radio').first();
      await firstRadio.focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await alternateConfidence.getByRole('radio').nth(1).getAttribute('aria-checked'), 'true');
      assert.equal(await alternateConfidence.locator('[tabindex="0"]').count(), 1);
      await page.keyboard.press('End');
      assert.equal(await alternateConfidence.getByRole('radio').last().getAttribute('aria-checked'), 'true');
      await page.getByRole('button', { name: /^Back to Primary Input/ }).click();
      assert.equal(await reloadedForm.getByRole('radio', { name: 'Ready to apply it', exact: true }).getAttribute('aria-checked'), 'true');
    });

    // -------------------------------------------------------------------------
    // TEST 3: Exercise-Free Lesson Check-in and Draft Isolation
    // -------------------------------------------------------------------------
    await check('3. Exercise-free lesson CheckIn functions and drafts remain isolated', async () => {
      await page.goto(`${url}/dashboard?view=proof`);
      await page.locator('#view-proof').waitFor();

      // Switch to les_arrays_03 (exercise-free lesson)
      await page.locator('#proof-topic-select').selectOption('topic_arrays');
      await page.locator('#proof-lesson-select').selectOption('les_arrays_03');

      // Verify empty trace notice
      await page.getByText('No Interactive Proof Trace Attached to this Lesson').waitFor();

      // Lesson check-in radios exist
      const lessonCard = page.locator('.rounded-xl').filter({ hasText: /Lesson Reflection/i });
      await lessonCard.waitFor();

      const confRadios = lessonCard.getByRole('radiogroup', { name: 'How did this feel?' });
      await confRadios.waitFor();

      const unsureRadio = confRadios.getByRole('radio', { name: "I'm still unsure" });
      await unsureRadio.click();
      assert.equal(await unsureRadio.getAttribute('aria-checked'), 'true');

      // Switch to another lesson and verify draft is isolated (not leaked)
      await page.locator('#proof-lesson-select').selectOption('les_arrays_04');
      const confRadios4 = page.locator('.rounded-xl').filter({ hasText: /Lesson Reflection/i }).getByRole('radiogroup', { name: 'How did this feel?' });
      const unsureRadio4 = confRadios4.getByRole('radio', { name: "I'm still unsure" });
      assert.equal(await unsureRadio4.getAttribute('aria-checked'), 'false', 'Draft checkIn must not leak across lessons');

      // Switch back to les_arrays_03 and verify draft is preserved
      await page.locator('#proof-lesson-select').selectOption('les_arrays_03');
      const unsureRadioReturn = page.locator('.rounded-xl').filter({ hasText: /Lesson Reflection/i }).getByRole('radiogroup', { name: 'How did this feel?' }).getByRole('radio', { name: "I'm still unsure" });
      assert.equal(await unsureRadioReturn.getAttribute('aria-checked'), 'true', 'Draft checkIn must be preserved on return');

      await page.getByRole('button', { name: 'Save as In-Progress', exact: true }).click();
      await page.getByText('Lesson progress & notes saved.', { exact: true }).waitFor();
      await page.reload();
      await page.locator('#proof-topic-select').selectOption('topic_arrays');
      await page.locator('#proof-lesson-select').selectOption('les_arrays_03');
      const savedChoice = page.getByRole('radio', { name: "I'm still unsure", exact: true });
      assert.equal(await savedChoice.getAttribute('aria-checked'), 'true');
      await savedChoice.click();
      await page.getByRole('button', { name: 'Save as In-Progress', exact: true }).click();
      await page.getByText('Lesson progress & notes saved.', { exact: true }).waitFor();
      await page.reload();
      await page.locator('#proof-topic-select').selectOption('topic_arrays');
      await page.locator('#proof-lesson-select').selectOption('les_arrays_03');
      assert.equal(await page.locator('[role="radio"][aria-checked="true"]').count(), 0, 'Deselected check-in remains cleared after saving and reloading');
    });

    // -------------------------------------------------------------------------
    // TEST 4: Viewports & Theme Contrast / No Overflow
    // -------------------------------------------------------------------------
    await check('4. Proof check-ins and modal sliders fit four widths across six themes', async () => {
      const viewports = [
        { width: 1440, height: 900 },
        { width: 1024, height: 768 },
        { width: 390, height: 844 },
        { width: 320, height: 568 }
      ];

      for (const vp of viewports) {
        await page.setViewportSize(vp);
        await page.goto(`${url}/dashboard?view=proof`);
        await page.locator('#view-proof').waitFor();
        if (vp.width < 640) await page.locator('#toggle-mobile-pickers').click();
        await page.locator('#proof-topic-select').selectOption('topic_arrays');
        await page.locator('#proof-lesson-select').selectOption('les_arrays_03');

        for (const style of ['frosted-sage', 'study-journal', 'quiet-focus']) {
          for (const theme of ['light', 'dark']) {
            await page.evaluate(
              ({ s, t }) => {
                document.documentElement.dataset.style = s;
                document.documentElement.dataset.theme = t;
              },
              { s: style, t: theme }
            );

            // Verify no horizontal overflow on Proof Studio with sliders/checkins
            const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
            const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
            assert.ok(
              scrollWidth <= clientWidth + 1,
              `Horizontal overflow detected at ${vp.width}x${vp.height} (${style}/${theme}): scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`
            );
          }
        }

        // Capture evidence screenshots in default light theme
        await page.evaluate(() => {
          document.documentElement.dataset.style = 'frosted-sage';
          document.documentElement.dataset.theme = 'light';
        });

        // 1. Proof Studio with CheckIns
        await page.locator('.reflection-checkin').first().screenshot({
          path: path.join(output, `proof-checkins-${vp.width}x${vp.height}.png`),
        });

        // 2. Week View with Availability Sliders
        await page.goto(`${url}/dashboard?view=week`);
        await page.locator('#view-week').waitFor();
        const replanBtn = page.getByRole('button', { name: /Replan Week|Build my week/i });
        if (await replanBtn.count() > 0) {
          await replanBtn.click();
          await page.locator('.availability-picker').waitFor();
          await page.locator('.availability-picker input[type="range"]').first().scrollIntoViewIfNeeded();
          for (const style of ['frosted-sage', 'study-journal', 'quiet-focus']) {
            for (const theme of ['light', 'dark']) {
              await page.evaluate(({ style, theme }) => {
                document.documentElement.dataset.style = style;
                document.documentElement.dataset.theme = theme;
              }, { style, theme });
              assert.ok(await page.locator('.availability-picker').evaluate((el) => el.scrollWidth <= el.clientWidth + 1), `Slider picker overflow: ${vp.width}/${style}/${theme}`);
            }
          }
          await page.evaluate(() => {
            document.documentElement.dataset.style = 'frosted-sage';
            document.documentElement.dataset.theme = 'light';
          });
          await page.screenshot({
            path: path.join(output, `modal-sliders-${vp.width}x${vp.height}.png`),
            fullPage: true
          });
          const cancelBtn = page.getByRole('button', { name: /Cancel/i });
          if (await cancelBtn.count() > 0) await cancelBtn.first().click();
        }
      }
    });

    assert.deepEqual(errors, [], 'No uncaught browser errors');

    console.log('\n============================================================');
    console.log('🎉 ALL QUICK CHECK-INS AND TIME SLIDERS SCENARIOS PASSED!');
    console.log('============================================================');
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
