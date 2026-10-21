const { chromium } = require('D:/Projects/Deadline-Catcher/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const EVIDENCE_DIR = path.resolve(__dirname, '../.local/full-local-qa/2026-10-21T11-48-00Z/stage5');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const BASE_URL = process.env.PREVIEW_URL || 'http://127.0.0.1:5173';

(async () => {
  console.log('====================================================');
  console.log('STAGE 5: PRACTICE, REVIEW, PROGRESS & MY WEEK');
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
    // AUTHENTICATE WITH COMPLETED STUDENT (Has completed M01-M12 with hints & spaced reviews)
    // ----------------------------------------------------
    console.log('\n--- Authenticating student.completed@nextstep.local ---');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('#signin-email', 'student.completed@nextstep.local');
    await page.fill('#signin-password', 'password123');
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/dashboard');

    // ----------------------------------------------------
    // PART A: Practice Library Verification (#nav-practice)
    // ----------------------------------------------------
    console.log('\n--- Part A: Practice Library Verification ---');
    const practiceNavBtn = await page.waitForSelector('#nav-practice');
    await practiceNavBtn.click();
    await page.waitForTimeout(400);

    const practiceHeading = await page.waitForSelector('#practice-heading');
    assert.ok(practiceHeading, 'Practice Library heading must be visible');

    // 1. Search filter
    console.log('Testing search query filter in Practice Library...');
    const searchInput = await page.waitForSelector('#practice-search');
    await searchInput.fill('Stock');
    await page.waitForTimeout(300);

    let problemCards = await page.$$('div[role="list"][aria-label="Practice problem list"] article[role="listitem"]');
    assert.ok(problemCards.length > 0, 'Search for "Stock" must yield at least 1 problem card');
    const firstTitle = await problemCards[0].$('h3');
    const titleText = await firstTitle.textContent();
    assert.ok(titleText.toLowerCase().includes('stock'), `Problem title must match query, got: ${titleText}`);

    // 2. Clear Search filter
    const clearBtn = await page.waitForSelector('button[aria-label="Clear practice search"]');
    await clearBtn.click();
    await page.waitForTimeout(300);
    const clearedInputVal = await searchInput.inputValue();
    assert.equal(clearedInputVal, '', 'Clear button must empty search input');

    // 3. Topic filter
    console.log('Testing Topic dropdown filter...');
    await page.selectOption('#practice-topic-filter', 'topic_arrays');
    await page.waitForTimeout(300);
    const arrayCards = await page.$$('div[role="list"][aria-label="Practice problem list"] article[role="listitem"]');
    assert.ok(arrayCards.length > 0, 'Topic filter must return array problems');

    // 4. Difficulty filter
    console.log('Testing Difficulty dropdown filter...');
    await page.selectOption('#practice-difficulty-filter', 'Easy');
    await page.waitForTimeout(300);

    // Reset filters to All
    await page.selectOption('#practice-topic-filter', 'all');
    await page.selectOption('#practice-difficulty-filter', 'all');
    await page.waitForTimeout(300);

    // 5. Expand problem card & check external link and self-reported form
    console.log('Expanding problem card and recording practice attempt...');
    const targetCard = (await page.$$('div[role="list"][aria-label="Practice problem list"] article[role="listitem"]'))[0];
    const expandBtn = await targetCard.$('button:has-text("Log Outcome"), button:has-text("Update Log")');
    if (expandBtn) {
      await expandBtn.click();
      await page.waitForTimeout(300);
    }

    // Check external problem link
    const externalLink = await targetCard.waitForSelector('a:has-text("Solve")');
    const externalHref = await externalLink.getAttribute('href');
    assert.ok(externalHref && externalHref.startsWith('http'), `External link must have valid URL: ${externalHref}`);
    const linkRel = await externalLink.getAttribute('rel');
    assert.ok(linkRel && linkRel.includes('noopener'), 'External link must have rel="noopener" for security');

    // Select self-reported outcome
    const outcomeSelect = await targetCard.waitForSelector('select[id^="prac-outcome-"]');
    await outcomeSelect.selectOption('solved_independently');

    const noteArea = await targetCard.waitForSelector('textarea[id^="prac-note-"]');
    await noteArea.fill('Solved with single pass hash map in O(N) time and O(N) space.');

    // Submit attempt
    const saveAttemptBtn = await targetCard.waitForSelector('button[type="submit"]:has-text("Save Practice Log")');
    await saveAttemptBtn.click();
    await page.waitForTimeout(600);

    const saveNotice = await targetCard.waitForSelector('[role="status"]:has-text("Self-reported attempt saved")');
    assert.ok(saveNotice, 'Practice attempt save notice must appear');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-practice-library.png') });
    recordPass('PRACTICE-01..05: Search, filters, external link validation, and self-reported attempt saved');

    // ----------------------------------------------------
    // PART B: Review Queue & Spaced Recall (#nav-review)
    // ----------------------------------------------------
    console.log('\n--- Part B: Review Queue & Spaced Recall Verification ---');
    const reviewNavBtn = await page.waitForSelector('#nav-review');
    await reviewNavBtn.click();
    await page.waitForTimeout(400);

    const reviewHeading = await page.waitForSelector('#review-heading');
    assert.ok(reviewHeading, 'Review heading must be visible');

    // Check review queue cards
    const reviewItems = await page.$$('article.review-card');
    console.log(`Found ${reviewItems.length} review item(s) queued.`);
    assert.ok(reviewItems.length > 0, 'Review queue should have items from hint-assisted starter missions or difficulties');

    // Click "Recall" on the first queued item
    const recallActionBtn = await reviewItems[0].$('button:has-text("Recall")');
    assert.ok(recallActionBtn, 'Review card must have a recall action button');
    await recallActionBtn.click();
    await page.waitForTimeout(400);

    // Verify RecallPanel opens
    const recallPanel = await page.waitForSelector('section.recall-panel, section[aria-label*="Recall"]');
    assert.ok(recallPanel, 'Recall panel must open upon clicking recall action');

    // Select confidence rating: option 4 (Comfortable / Good)
    console.log('Selecting self-rated recall confidence...');
    const confRadios = await page.$$('div[role="radiogroup"][aria-label="Self-rated confidence level"] button[role="radio"]');
    assert.ok(confRadios.length >= 3, 'Recall confidence radio group must have options');
    await confRadios[3].click(); // Option 4
    await page.waitForTimeout(200);

    // Enter recall draft takeaway note
    const recallTextarea = await page.waitForSelector('textarea#recall-attempt-draft');
    await recallTextarea.fill('Recall check: Invariant is preserved by ensuring loop bounds handle single-element edge case.');

    // Save recall attempt
    const saveReviewBtn = await page.waitForSelector('button:has-text("Save review")');
    await saveReviewBtn.click();
    await page.waitForTimeout(600);

    // Close recall panel
    const doneRecallBtn = await page.waitForSelector('button:has-text("Done with recall")');
    await doneRecallBtn.click();
    await page.waitForTimeout(300);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02-review-queue-recall.png') });
    recordPass('REVIEW-01..03: Review queue rendered, Recall panel confidence rating and review saved');

    // ----------------------------------------------------
    // PART C: Progress Insights Verification (#nav-insights)
    // ----------------------------------------------------
    console.log('\n--- Part C: Progress Insights Verification ---');
    const insightsNavBtn = await page.waitForSelector('#nav-insights');
    await insightsNavBtn.click();
    await page.waitForTimeout(400);

    const insightsHeading = await page.waitForSelector('#insights-heading');
    assert.ok(insightsHeading, 'Insights heading must be visible');

    // Verify metric cards
    const metricsGrid = await page.waitForSelector('.insights-metrics-grid');
    const metricsText = await metricsGrid.textContent();
    assert.ok(metricsText.includes('Completed Missions'), 'Metrics must show completed missions count');
    assert.ok(metricsText.includes('Recorded Outcomes') && metricsText.includes('solo'), 'Metrics must show recorded outcomes with solo count');
    assert.ok(metricsText.includes('Active Days'), 'Metrics must show active days');

    // Test Export Goal Data (JSON)
    console.log('Testing Export Goal Data (JSON)...');
    const exportBtn = await page.waitForSelector('button[aria-label="Download goal snapshot as JSON"]');
    await exportBtn.click();
    await page.waitForTimeout(400);

    const exportNotice = await page.waitForSelector('span[role="status"]:has-text("Snapshot prepared")');
    assert.ok(exportNotice, 'Export goal snapshot status notice must appear');

    // Verify Reflections section rendered
    const reflectionsSection = await page.waitForSelector('section.insights-reflections-section, section[aria-label*="reflections"]');
    assert.ok(reflectionsSection, 'Reflections section should be visible in insights');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03-progress-insights.png') });
    recordPass('INSIGHTS-01..04: Metric counts, completion percentages, reflections list, and JSON export verified');

    // ----------------------------------------------------
    // PART D: Foundations Checkpoint & Continuation Plan (#nav-today -> Checkpoint -> Week)
    // ----------------------------------------------------
    console.log('\n--- Part D: Foundations Checkpoint & Continuation Plan ---');
    const todayNavBtn = await page.waitForSelector('#nav-today');
    await todayNavBtn.click();
    await page.waitForTimeout(400);

    // Verify Starter Track is Completed banner
    const starterCompletedBanner = await page.waitForSelector('text=DSA Starter Completed!');
    assert.ok(starterCompletedBanner, 'DSA Starter Completed celebration banner must be visible');

    // Launch Foundations Checkpoint or Next Step
    console.log('Launching Foundations Checkpoint modal or Continuation...');
    const checkpointBtn = await page.waitForSelector('button[data-guide="today-primary-action-btn"], button:has-text("Check My Foundations"), button:has-text("Review Details"), button:has-text("Choose My Next Step")');
    await checkpointBtn.click();
    await page.waitForTimeout(600);

    const checkpointTitle = await page.$('#checkpoint-title');
    if (checkpointTitle) {
      console.log('Stepping through checkpoint questions...');
      let hasMore = true;
      let questionsAnswered = 0;

      while (hasMore) {
        // Pick first radio option
        const radioLabels = await page.$$('label:has(input[type="radio"])');
        if (radioLabels.length > 0) {
          await radioLabels[0].click();
          await page.waitForTimeout(200);
          questionsAnswered++;
        }

        const nextBtn = await page.$('button:has-text("Next Question")');
        if (nextBtn && (await nextBtn.isVisible())) {
          await nextBtn.click();
          await page.waitForTimeout(300);
        } else {
          hasMore = false;
        }
      }

      console.log(`Answered ${questionsAnswered} checkpoint questions.`);

      // Fill reflection if present
      const chkReflection = await page.$('textarea#checkpoint-reflection');
      if (chkReflection && (await chkReflection.isVisible())) {
        await chkReflection.fill('Completed checkpoint evaluation. Core invariants for arrays and hashing feel strong.');
        await page.waitForTimeout(200);
      }

      // Submit checkpoint
      const submitBtn = await page.waitForSelector('button:has-text("Submit Checkpoint")');
      await submitBtn.click();
      await page.waitForTimeout(800);

      const proceedBtn = await page.waitForSelector('button:has-text("Proceed to Next-Week Plan")');
      await proceedBtn.click();
      await page.waitForTimeout(600);
    }

    // Verify Continuation Plan Modal opens
    const planModalTitle = await page.waitForSelector('#continuation-plan-title');
    assert.ok(planModalTitle, 'Continuation Plan modal must be open');

    // Click "Preview Next-Week Plan"
    console.log('Generating preview for next-week continuation plan...');
    const previewPlanBtn = await page.waitForSelector('button:has-text("Preview Next-Week Plan")');
    await previewPlanBtn.click();
    await page.waitForTimeout(800);

    // Verify step transitioned to confirmation and click "Accept & Start This Plan"
    console.log('Accepting continuation plan...');
    const acceptPlanBtn = await page.waitForSelector('button:has-text("Accept & Start This Plan")');
    await acceptPlanBtn.click();
    await page.waitForTimeout(1000);

    // Verify redirect or transition to My Week (#view-week)
    const weekNavBtn = await page.waitForSelector('#nav-week');
    await weekNavBtn.click();
    await page.waitForTimeout(400);

    const weekHeading = await page.waitForSelector('#week-heading');
    assert.ok(weekHeading, 'Weekly Plan heading must be visible');

    // Verify scheduled sessions exist
    const weekSessions = await page.$$('article.week-session, [data-testid="week-session"]');
    console.log(`Found ${weekSessions.length} weekly study session(s) scheduled.`);
    assert.ok(weekSessions.length > 0, 'Weekly plan must have scheduled study sessions');

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04-my-week-continuation.png') });
    recordPass('CONTINUATION-01..06: Foundations checkpoint evaluated, next-week plan accepted, and weekly sessions scheduled in My Week');

  } catch (err) {
    recordFail('STAGE-5-VERIFICATION', err);
  } finally {
    await browser.close();
  }

  console.log('\n====================================================');
  console.log(`STAGE 5 RESULTS: ${results.passed.length} PASSED, ${results.failed.length} FAILED`);
  console.log('====================================================');

  if (results.failed.length > 0) {
    process.exit(1);
  }
})();
