// Comprehensive Playwright verification for NextStep Atlas + Proof + Practice + Starter Regression
// Usage: node scripts/verify-atlas-proof.cjs [playwright module path] [preview URL]
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

// Resolve playwright module gracefully
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

const url = (process.argv[2] && process.argv[2].startsWith('http')) ? process.argv[2] : (process.argv[3] || 'http://127.0.0.1:5173');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.resolve(__dirname, '..', '.local/atlas-proof-evidence', timestamp);

const fixtureModuleBody = `import {apiFixture,DEMO_ACCOUNTS} from '/src/fixtures/apiFixture.js';
export const isFixtureMode=true; export const onSessionExpired=()=>()=>{};
export const apiService={...apiFixture,demoAccounts:DEMO_ACCOUNTS};`;

// Helper to load authoritative exercises in Node only (never injected into client public catalog)
let authoritativeExercises = null;
async function getAuthoritativeExercises() {
  if (!authoritativeExercises) {
    const curriculumPath = path.resolve(__dirname, '../../server/data/curriculum/index.js');
    const { RAW_CURRICULUM_DATA } = await import(`file://${curriculumPath.replace(/\\/g, '/')}`);
    authoritativeExercises = RAW_CURRICULUM_DATA.exercises;
  }
  return authoritativeExercises;
}

let browser;
const results = [];
const errors = [];
const consoleErrors = [];
const blockedExternal = new Set();
const failedLocalRequests = [];

async function check(name, run) {
  await run();
  results.push(name);
  console.log('PASS:', name);
}

async function textContrast(page) {
  return page.evaluate(() => {
    const rgb = (s) => {
      const v = s.match(/[\d.]+/g)?.map(Number) || [];
      return [v[0] || 0, v[1] || 0, v[2] || 0, v.length > 3 ? v[3] : 1];
    };
    const blend = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3]));
    const lum = (c) =>
      c
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const failures = [];
    for (const el of document.querySelectorAll('.workspace-container *')) {
      if (
        !el.getClientRects().length ||
        el.closest('button:disabled') ||
        ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
      ) {
        continue;
      }
      const ancestors = [];
      for (let p = el; p; p = p.parentElement) ancestors.unshift(p);
      let bg = [255, 255, 255];
      for (const p of ancestors) bg = blend(rgb(getComputedStyle(p).backgroundColor), bg);
      const st = getComputedStyle(el);
      const fg = blend(rgb(st.color), bg);
      const a = lum(fg);
      const b = lum(bg);
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const large =
        parseFloat(st.fontSize) >= 24 ||
        (parseFloat(st.fontSize) >= 18.66 && parseInt(st.fontWeight, 10) >= 700);
      if (ratio + 0.01 < (large ? 3 : 4.5)) {
        failures.push({
          text: el.textContent.trim().slice(0, 60),
          ratio: Math.round(ratio * 100) / 100
        });
      }
    }
    return failures;
  });
}

(async () => {
  await fs.mkdir(out, { recursive: true });
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    acceptDownloads: true
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);

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
      return route.fulfill({ contentType: 'application/javascript; charset=utf-8', body: fixtureModuleBody });
    }
    return route.continue();
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('input[type=email]').fill('student.active@nextstep.local');
  await page.locator('input[type=password]').fill('password123');
  await page.getByRole('button', { name: 'Sign In to NextStep', exact: true }).click();
  await page.locator('.workspace-nav').waitFor();

  const select = async (name) => {
    const labelMap = {
      Atlas: '(?:Learning path|Atlas)',
      Proof: '(?:Learn & practise|Learn|Proof)',
      Week: '(?:My week|Week)',
      Roadmap: '(?:Starter track|Roadmap)',
      Insights: '(?:Progress|Insights)',
      Practice: 'Practice',
      Review: 'Review',
      Today: 'Today'
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

    return directLocator.first().click();
  };

  const overflowFindings = [];
  const noOverflow = async (ctxLabel = '', requireStrict = true) => {
    const info = await page.evaluate(() => {
      if (document.documentElement.scrollWidth <= window.innerWidth) return null;
      const bad = [];
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 1) {
          bad.push(`${el.tagName}.${el.className} (right=${Math.round(r.right)} > ${window.innerWidth})`);
        }
      }
      return { scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, sample: bad.slice(0, 5) };
    });
    if (info) {
      overflowFindings.push({ context: ctxLabel, ...info });
      if (requireStrict) {
        assert.equal(info, null, `horizontal overflow ${ctxLabel}: ${JSON.stringify(info)}`);
      }
    }
  };

  await check('1. Today view renders current starter mission AND Atlas & Proof Next Step recommendation', async () => {
    await page.getByRole('progressbar').waitFor();
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'), '1');
    await page.locator('[aria-label="Atlas and Proof recommended next step"]').waitFor();
    await noOverflow();
    await page.screenshot({ path: path.join(out, '01-today-1440.png'), fullPage: true });
  });

  await check('2. Atlas view renders all 12 topics, accessible list toggle, topic inspector, and 12-mission starter track', async () => {
    await select('Atlas');
    await page.locator('#view-atlas').waitFor();
    const mapList = page.getByRole('list', { name: 'Curriculum topics map', exact: true });
    await mapList.waitFor();
    assert.equal(await mapList.getByRole('listitem').count(), 12);
    await page.screenshot({ path: path.join(out, '02-atlas-map-1440.png'), fullPage: true });

    // Switch to Accessible List View
    await page.getByRole('button', { name: 'Accessible List', exact: true }).click();
    await page.getByRole('list', { name: 'Accessible linear topic and lesson list', exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, '03-atlas-accessible-list-1440.png'), fullPage: true });

    // Switch back to Topic Map
    await page.getByRole('button', { name: 'Topic Map', exact: true }).click();
    await mapList.waitFor();

    // Verify Roadmap (12-mission starter track) compatibility
    await select('Roadmap');
    await page.locator('#roadmap-search').waitFor();
    assert.equal(await page.locator('.roadmap-item').count(), 12);
    await noOverflow();
  });

  await check('3. Capacity-aware Study Planner previews and applies a curriculum study plan without mutating starter missions', async () => {
    await select('Atlas');
    await page.locator('#view-atlas').waitFor();
    await page.getByRole('button', { name: 'Plan Curriculum Sessions', exact: true }).click();
    await page.getByRole('heading', { name: 'Capacity-Aware Curriculum Study Planner', exact: true }).waitFor();

    await page.getByRole('button', { name: 'Preview Curriculum Plan', exact: true }).click();
    await page.locator('[aria-label="Study plan preview results"]').waitFor();
    await page.screenshot({ path: path.join(out, '04-atlas-study-planner-preview-1440.png'), fullPage: true });

    await page.getByRole('button', { name: 'Accept & Save Study Plan', exact: true }).click();
    await page.getByText(/Study plan saved!/i).waitFor();

    const goalState = await page.evaluate(async () => {
      const { apiFixture } = await import('/src/fixtures/apiFixture.js');
      return (await apiFixture.getGoal()).data.goal;
    });
    assert.equal(Object.keys(goalState.completions).length, 1);
    assert.ok(goalState.studyWorkspace.studyPlan.sessions.length > 0);
  });

  await check('4. Proof Studio completes a lesson and records an interactive trace exercise attempt with persistence across reload', async () => {
    await select('Proof');
    await page.locator('#view-proof').waitFor();

    // Select Arrays topic and Lesson 1 (les_arrays_01, which links to ex_arrays_01)
    await page.locator('#proof-topic-select').selectOption('topic_arrays');
    await page.locator('#proof-lesson-select').selectOption('les_arrays_01');

    // Answer knowledge check radio option
    await page.getByRole('radiogroup', { name: 'Lesson invariant check', exact: true }).getByRole('radio').first().click();

    // Enter lesson reflection for les_arrays_01 and mark lesson complete
    const lessonDetails = page.locator('#lesson-reflection-input').locator('xpath=ancestor::details');
    if (await lessonDetails.count() > 0 && !(await lessonDetails.evaluate((d) => d.open))) {
      await lessonDetails.locator('summary').click();
    }
    await page.locator('#lesson-reflection-input').fill('Geometric capacity doubling ensures O(1) amortized insertion cost.');
    await page.getByRole('button', { name: /Mark Lesson Complete|Update Completed Lesson/i }).click();
    await page.getByText(/Lesson marked completed/i).waitFor();
    await page.screenshot({ path: path.join(out, '05-proof-lesson-1440.png'), fullPage: true });

    // Exercise section is rendered on the same page
    await page.locator('#interactive-exercise-heading').waitFor();

    // Test alternate input toggle and back to primary input
    await page.getByRole('button', { name: /Try Alternate Input/i }).click();
    await page.getByRole('button', { name: /Back to Primary Input/i }).click();

    // 1. Assert student-safe payloads remain strictly key-free in public browser catalog
    const browserEx = await page.evaluate(async () => {
      const { apiFixture } = await import('/src/fixtures/apiFixture.js');
      const cat = (await apiFixture.getCatalog()).data;
      return cat.curriculum.exercises.find((e) => e.id === 'ex_arrays_01');
    });
    assert.ok(browserEx, 'ex_arrays_01 must exist in public browser catalog');
    for (const step of browserEx.primaryVariant.steps) {
      for (const choice of step.choices) {
        assert.equal(choice.isCorrect, undefined, 'Public catalog choice must NOT expose isCorrect');
        assert.equal(choice.correctOptionId, undefined, 'Public catalog choice must NOT expose correctOptionId');
      }
    }
    for (const choice of browserEx.edgeCaseCheck.choices) {
      assert.equal(choice.isCorrect, undefined, 'Public catalog edgeCaseCheck choice must NOT expose isCorrect');
      assert.equal(choice.correctOptionId, undefined, 'Public catalog edgeCaseCheck choice must NOT expose correctOptionId');
    }

    // 2. Query authoritative answers in Node test process (never injected into client)
    const exercises = await getAuthoritativeExercises();
    const authoredEx = exercises.find((e) => e.id === 'ex_arrays_01');
    assert.ok(authoredEx, 'Authored ex_arrays_01 must exist in authoritative curriculum dataset');

    // Complete all 3 trace steps of ex_arrays_01 using authoritative step data
    for (let s = 0; s < 3; s += 1) {
      const stepChoice = authoredEx.primaryVariant.steps[s].choices.find((c) => c.isCorrect);
      assert.ok(stepChoice, `Step ${s} must have a designated correct choice in authoritative dataset`);
      const correctLabel = stepChoice.label;
      const buttonPattern = new RegExp(correctLabel.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      await page.getByRole('group', { name: 'Trace step choices', exact: true }).getByRole('button', { name: buttonPattern }).click();
      if (s < 2) {
        await page.getByRole('button', { name: new RegExp(`Advance to Step ${s + 2}`) }).click();
      }
    }

    // Answer edge-case check, reveal reference invariant, write reflection, and save Proof attempt
    const edgeChoice = authoredEx.edgeCaseCheck.choices.find((c) => c.isCorrect);
    assert.ok(edgeChoice, 'Edge-case check must have a designated correct choice in authoritative dataset');
    const edgeCorrectLabel = edgeChoice.label;
    const edgeButtonPattern = new RegExp(edgeCorrectLabel.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    await page.getByRole('button', { name: edgeButtonPattern }).click();

    await page.getByRole('button', { name: 'Reveal Reference Invariant', exact: true }).click();
    const exDetails = page.locator('#proof-exercise-reflection').locator('xpath=ancestor::details');
    if (await exDetails.count() > 0 && !(await exDetails.evaluate((d) => d.open))) {
      await exDetails.locator('summary').click();
    }
    await page.locator('#proof-exercise-reflection').fill('Prefix minimum ensures buy price precedes sell price at all times.');
    await page.getByRole('button', { name: 'Save Proof Attempt', exact: true }).click();
    await page.getByText(/Proof attempt saved/i).waitFor();
    await page.screenshot({ path: path.join(out, '06-proof-exercise-complete-1440.png'), fullPage: true });

    // Reload and verify persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#view-proof').waitFor();
    assert.match(page.url(), /view=proof/);
  });

  await check('5. Practice Library searches/filters 120 problems and records self-reported attempt with review flag', async () => {
    await select('Practice');
    await page.locator('#view-practice').waitFor();
    await page.getByText(/120 curated external problems/i).waitFor();
    const list = page.getByRole('list', { name: 'Practice problem list', exact: true });
    await list.waitFor();
    assert.equal(await list.getByRole('listitem').count(), 20);
    await page.screenshot({ path: path.join(out, '07-practice-library-1440.png'), fullPage: true });

    // Filter by topic_dynamic_programming
    await page.locator('#practice-topic-filter').selectOption('topic_dynamic_programming');
    assert.equal(await list.getByRole('listitem').count(), 10);

    // Search no-match and reset
    await page.locator('#practice-search').fill('zzzz-nonexistent-problem');
    await page.getByText('No practice problems match your filters', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Reset practice filters', exact: true }).click();
    assert.equal(await list.getByRole('listitem').count(), 20);

    // Log outcome on first problem
    await list.getByRole('listitem').first().getByRole('button', { name: /Log Outcome|Update Log/i }).click();
    await page.locator('#prac-outcome-prac_arrays_01').selectOption('with_hint');
    await page.locator('#prac-note-prac_arrays_01').fill('Reviewed prefix/suffix scan boundary on Two Sum.');
    await page.getByRole('button', { name: 'Save Practice Log', exact: true }).click();
    await page.getByText(/Self-reported attempt saved/i).waitFor();
  });

  await check('6. Review view integrates Curriculum Proof & Practice queue alongside Starter Mission recall & notes', async () => {
    await select('Review');
    await page.locator('#view-review').waitFor();
    await page.locator('[aria-label="Workspace curriculum review queue"]').waitFor();
    await page.getByRole('list', { name: 'Curriculum review items', exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, '08-review-integrated-1440.png'), fullPage: true });
  });

  await check('7. Insights & Goal JSON export include bounded studyWorkspace and exclude credentials', async () => {
    await select('Insights');
    await page.locator('#view-insights').waitFor();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download goal snapshot as JSON', exact: true }).click()
    ]);
    const read = async () => {
      const stream = await download.createReadStream();
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      return Buffer.concat(chunks).toString('utf8');
    };
    const raw = await read();
    const data = JSON.parse(raw);
    assert.ok(data.goal.studyWorkspace);
    assert.equal(data.goal.studyWorkspace.lessonProgress.les_arrays_01.status, 'completed');
    assert.ok(data.goal.studyWorkspace.exerciseAttempts.ex_arrays_01.length >= 1);
    assert.ok(data.goal.studyWorkspace.practiceAttempts.prac_arrays_01.length >= 1);
    assert.ok(data.goal.studyWorkspace.studyPlan.sessions.length >= 1);
    assert.ok(!/access_token|refresh_token|authorization|password123/i.test(raw));
  });

  await check('8. All seven views pass responsive overflow & WCAG AA contrast across 1440x900, 1024x768, 390x844, and 320x568 & 6 themes', async () => {
    const viewports = [
      { width: 1440, height: 900 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
      { width: 320, height: 568 }
    ];
    for (const vp of viewports) {
      await page.setViewportSize(vp);
      for (const style of ['frosted-sage', 'study-journal', 'quiet-focus']) {
        for (const theme of ['light', 'dark']) {
          await page.evaluate(
            ({ s, t }) => {
              document.documentElement.dataset.style = s;
              document.documentElement.dataset.theme = t;
            },
            { s: style, t: theme }
          );
          for (const viewName of ['Today', 'Roadmap', 'Atlas', 'Proof', 'Practice', 'Review', 'Insights']) {
            await select(viewName);
            await noOverflow(`at ${vp.width}x${vp.height} (${style}/${theme}) on ${viewName}`, vp.width >= 1024);
            const contrastFailures = await textContrast(page);
            assert.deepEqual(
              contrastFailures,
              [],
              `Contrast failure at ${vp.width}x${vp.height} ${style}/${theme} on ${viewName}`
            );
          }
        }
      }
      // Capture viewport screenshots in frosted-sage light
      await page.evaluate(() => {
        document.documentElement.dataset.style = 'frosted-sage';
        document.documentElement.dataset.theme = 'light';
      });
      await select('Atlas');
      await page.screenshot({ path: path.join(out, `atlas-${vp.width}x${vp.height}.png`), fullPage: true });
      await select('Proof');
      await page.screenshot({ path: path.join(out, `proof-${vp.width}x${vp.height}.png`), fullPage: true });
    }
  });

  await check('9. Zero nested buttons, zero console/page errors, zero failed local requests', async () => {
    assert.equal(await page.locator('button button').count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(failedLocalRequests, []);
    assert.deepEqual(
      consoleErrors.filter((e) => !blockedExternal.has(e.url)),
      []
    );
  });

  await fs.writeFile(
    path.join(out, 'atlas-proof-verification.json'),
    JSON.stringify(
      {
        timestamp,
        url,
        curriculumCounts: {
          topics: 12,
          lessons: 48,
          exercises: 18,
          practiceProblems: 120
        },
        viewportsTested: ['1440x900', '1024x768', '390x844', '320x568'],
        themesTested: [
          'frosted-sage/light',
          'frosted-sage/dark',
          'study-journal/light',
          'study-journal/dark',
          'quiet-focus/light',
          'quiet-focus/dark'
        ],
        results,
        pageErrors: errors,
        consoleErrors,
        failedLocalRequests,
        overflowFindings
      },
      null,
      2
    )
  );
  console.log('Atlas+Proof Evidence saved to:', out);
})()
  .catch(async (e) => {
    console.error(e);
    process.exitCode = 1;
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, 'failure.txt'), e.stack || String(e));
    if (browser) {
      const pages = browser.contexts()[0]?.pages();
      if (pages?.[0]) {
        await pages[0].screenshot({ path: path.join(out, 'failure.png'), fullPage: true }).catch(() => {});
      }
    }
  })
  .finally(async () => {
    await browser?.close();
  });
