const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'D:/Projects/Deadline-Catcher/node_modules/playwright');
const url = process.argv[3] || 'http://127.0.0.1:5173';
const output = path.resolve(__dirname, '../.local/weekly-execution-evidence');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', err => errors.push(err.message));
  const results = [];
  const check = async (name, run) => { await run(); results.push(name); console.log('PASS: ' + name); };
  async function goal() { return page.evaluate(async () => (await (await import('/src/fixtures/apiFixture.js')).apiFixture.getGoal()).data.goal); }
  const week = async () => { await page.goto(url + '/dashboard?view=week'); await page.locator('#view-week').waitFor(); };
  try {
    await fs.mkdir(output, { recursive: true });
    await page.route('**/*', route => {
      const request = new URL(route.request().url());
      if (request.origin !== new URL(url).origin) return route.abort();
      if (request.pathname === '/src/services/apiService.js') return route.fulfill({ contentType: 'application/javascript', body: `import {apiFixture, DEMO_ACCOUNTS} from '/src/fixtures/apiFixture.js'; export const isFixtureMode=true; export const onSessionExpired=()=>()=>{}; export const apiService={...apiFixture,demoAccounts:DEMO_ACCOUNTS};` });
      return route.continue();
    });
    await page.goto(url);
    await page.locator('input[type=email]').fill('student.completed@nextstep.local');
    await page.locator('input[type=password]').fill('password123');
    await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
    await page.locator('.workspace-nav').waitFor();
    await check('Direct Week URL handles no plan without inventing sessions', async () => {
      await week(); await page.getByRole('button', { name: 'Build my week', exact: true }).waitFor();
      assert.equal(await page.getByTestId('week-session').count(), 0);
    });
    const ids = await page.evaluate(async () => {
      const { apiFixture, safeStorage } = await import('/src/fixtures/apiFixture.js');
      const { localDay, shiftDay } = await import('/src/services/activity.js');
      const catalog = (await apiFixture.getCatalog()).data.curriculum;
      const goal = (await apiFixture.getGoal()).data.goal; const user = await apiFixture.getCurrentUser();
      const today = localDay(); const exercise = catalog.exercises.find(item => item.id === 'ex_arrays_02');
      const lesson = catalog.lessons.find(item => item.id === 'les_arrays_02'); const completed = catalog.lessons.find(item => item.id === 'les_arrays_01');
      const practice = catalog.practiceProblems.find(item => item.topicId === lesson.topicId);
      const make = (item, itemType, date, extra = {}) => ({ itemId: item.id, title: item.title, topicId: item.topicId, itemType, date, allocatedMinutes: 15, totalEstimatedMinutes: 15, partIndex: 1, totalParts: 1, ...extra });
      goal.studyWorkspace.lessonProgress = { [completed.id]: { status: 'completed', updatedAt: '2000-01-01T00:00:00Z' } };
      goal.studyWorkspace.exerciseAttempts = { [exercise.id]: [{ outcome: 'independent', savedAt: '2000-01-01T00:00:00Z', nextReviewDate: '2099-01-01' }] };
      goal.studyWorkspace.practiceAttempts = {};
      goal.studyWorkspace.continuation.suggestedPlan.acceptedAt = new Date().toISOString();
      goal.studyWorkspace.studyPlan = { unscheduledItemIds: ['les_arrays_03'], availability: { mon: 60, tue: 60, wed: 60, thu: 60, fri: 60, sat: 60, sun: 60 }, sessions: [make(completed, 'lesson', today), make(exercise, 'exercise', shiftDay(today, -1), { isRevisit: true }), make(lesson, 'lesson', today), make(practice, 'practice', shiftDay(today, 8))] };
      safeStorage.setItem('nextstep_fixture_goal_' + user.id, JSON.stringify(goal));
      return { exercise: exercise.id, lesson: lesson.id, practice: practice.id, exerciseTitle: exercise.title, lessonTitle: lesson.title, practiceTitle: practice.title };
    });
    await week(); const original = await goal();
    await check('Pending, completed, missed and beyond-week allocations use real evidence', async () => {
      await page.getByRole('heading', { name: 'Make room to restart', exact: true }).waitFor();
      assert.equal(await page.locator('.week-day').count(), 7);
      assert.equal(await page.locator('.week-metrics strong').nth(0).textContent(), '4');
      assert.equal(await page.locator('.week-metrics strong').nth(1).textContent(), '1');
      await page.getByRole('button', { name: 'Completed', exact: true }).click();
      assert.equal(await page.locator('.week-days [data-testid=week-session]').count(), 1);
      await page.getByRole('button', { name: 'All', exact: true }).click();
      await page.getByRole('button', { name: 'Next seven days', exact: true }).click();
      await page.locator(`.week-days [data-item-id="${ids.practice}"]`).waitFor();
      await page.getByRole('button', { name: 'This week', exact: true }).click();
    });
    await check('Start actions resolve the right lesson, exercise and external practice log', async () => {
      await page.getByRole('button', { name: `Start ${ids.lessonTitle}`, exact: true }).click();
      assert.match(page.url(), /view=proof/); assert.equal(await page.locator('#proof-lesson-select').inputValue(), ids.lesson);
      await week(); await page.getByText('Show missed work', { exact: true }).click();
      await page.getByRole('button', { name: `Start ${ids.exerciseTitle}`, exact: true }).click();
      assert.match(page.url(), /view=proof/); assert.equal(await page.locator('#proof-lesson-select').inputValue(), ids.lesson);
      await week(); await page.getByRole('button', { name: 'Next seven days', exact: true }).click();
      await page.getByRole('button', { name: `Start ${ids.practiceTitle}`, exact: true }).click();
      assert.match(page.url(), /view=practice/); await page.locator(`#prac-note-${ids.practice}`).waitFor();
      assert.equal((await goal()).version, original.version);
    });
    await check('Replanning seeds only unfinished activities; cancel and preview do not mutate', async () => {
      await week(); await page.getByRole('button', { name: 'Replan remaining work', exact: true }).click();
      const dialog = page.locator('[role="dialog"][aria-labelledby="continuation-plan-title"]');
      await dialog.waitFor({ state: 'visible' });
      assert.equal(await dialog.getByRole('checkbox', { checked: true }).count(), 4);
      await page.keyboard.press('Escape'); assert.deepEqual(await goal(), original);
      await page.getByRole('button', { name: 'Replan remaining work', exact: true }).click();
      await dialog.getByRole('button', { name: 'Preview Next-Week Plan', exact: true }).click();
      await dialog.getByRole('button', { name: 'Accept & Start This Plan', exact: true }).waitFor();
      assert.deepEqual(await goal(), original);
      await dialog.getByRole('button', { name: 'Accept & Start This Plan', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      const updated = await goal(); assert.equal(updated.version, original.version + 1);
      assert.deepEqual(updated.completions, original.completions); assert.deepEqual(updated.schedule, original.schedule);
      assert.equal(updated.studyWorkspace.studyPlan.sessions.find(session => session.itemId === ids.exercise).isRevisit, true);
      assert.ok(updated.studyWorkspace.studyPlan.sessions.some(session => session.itemId === ids.practice)); assert.ok(updated.studyWorkspace.studyPlan.selectedItemIds.includes('les_arrays_03'), 'Unscheduled work must survive replanning');
      await page.reload(); await page.locator('#view-week').waitFor();
    });
    await check('Week fits four widths and all six appearances, with mobile More navigation', async () => {
      for (const width of [1440, 1024, 390, 320]) {
        await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
        for (const style of ['frosted-sage', 'study-journal', 'quiet-focus']) for (const theme of ['light', 'dark']) {
          await page.evaluate(({ style, theme }) => { document.documentElement.dataset.style = style; document.documentElement.dataset.theme = theme; document.documentElement.classList.toggle('dark', theme === 'dark'); }, { style, theme });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow ${width}/${style}/${theme}`);
        }
        await page.screenshot({ path: path.join(output, `week-${width}.png`), fullPage: true });
      }
      await page.getByRole('tab', { name: 'Today', exact: true }).click();
      const weekTab = page.getByRole('tab', { name: /^(?:My week|Week)$/ });
      if (await weekTab.isVisible()) {
        await weekTab.click();
      } else {
        await page.getByRole('button', { name: /More/ }).click();
        await page.getByRole('menuitem', { name: /^(?:My week|Week)$/ }).click();
      }
      await page.locator('#view-week').waitFor(); assert.match(page.url(), /view=week/);
    });
    await check('All-done plan offers a useful next plan and no remaining-work action', async () => {
      await page.evaluate(async () => {
        const { apiFixture, safeStorage } = await import('/src/fixtures/apiFixture.js'); const user = await apiFixture.getCurrentUser(); const goal = (await apiFixture.getGoal()).data.goal;
        const completedAt = new Date(Date.now() + 1000).toISOString();
        for (const session of goal.studyWorkspace.studyPlan.sessions) {
          if (session.itemType === 'lesson') goal.studyWorkspace.lessonProgress[session.itemId] = { status: 'completed', updatedAt: completedAt };
          if (session.itemType === 'exercise') goal.studyWorkspace.exerciseAttempts[session.itemId] = [{ outcome: 'independent', savedAt: completedAt }];
          if (session.itemType === 'practice') goal.studyWorkspace.practiceAttempts[session.itemId] = [{ outcome: 'solved_independently', savedAt: completedAt }];
        }
        safeStorage.setItem('nextstep_fixture_goal_' + user.id, JSON.stringify(goal));
      });
      await week(); await page.getByText('Your planned activities are complete.', { exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Replan remaining work', exact: true }).count(), 0);
      await page.getByRole('button', { name: 'Plan study activities', exact: true }).waitFor();
    });
    assert.deepEqual(errors, []); await fs.writeFile(path.join(output, 'result.json'), JSON.stringify({ passed: results.length, results, pageErrors: errors }, null, 2));
    console.log(`Weekly execution: ${results.length}/6 passed`);
  } finally { await context.close(); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

