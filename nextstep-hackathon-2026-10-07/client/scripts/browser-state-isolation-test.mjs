// Browser State Isolation & UI Verification Test
// Drives Chrome DevTools Protocol directly via native WebSocket
// Verifies all required user scenarios with real React interface and synthetic data

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const PORT = 5192;
const CDP_PORT = 9225;
const APP_URL = `http://localhost:${PORT}`;
const EVIDENCE_DIR = path.resolve('.local', 'atlas-proof-evidence', 'browser-isolation');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_USER_DATA = path.resolve('.local', 'chrome-browser-profile');

const fixtureModuleBody = `
import { apiFixture, DEMO_ACCOUNTS } from '/src/fixtures/apiFixture.js';
export const isFixtureMode = true;
export const onSessionExpired = () => () => {};

// Global hooks for simulation testing
window.__testControl = {
  simulateStepEvalFail: false,
  simulateStepEvalDelayMs: 0
};

export const apiService = {
  ...apiFixture,
  demoAccounts: DEMO_ACCOUNTS,
  async evaluateTraceStep(args) {
    if (window.__testControl?.simulateStepEvalDelayMs > 0) {
      await new Promise(r => setTimeout(r, window.__testControl.simulateStepEvalDelayMs));
    }
    if (window.__testControl?.simulateStepEvalFail) {
      const err = new Error('Simulated evaluation network error 500');
      err.status = 500;
      throw err;
    }
    return apiFixture.evaluateTraceStep(args);
  }
};
`;

let viteProcess = null;
let chromeProcess = null;
let ws = null;
let msgId = 1;

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(`CDP ${method} error: ${JSON.stringify(data.error)}`));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true
  });
  if (res.exceptionDetails) {
    throw new Error(`Eval error (${expression}): ${JSON.stringify(res.exceptionDetails)}`);
  }
  return res.result?.value;
}

async function waitForSelector(selector, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
    if (found) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for selector: ${selector}`);
}

async function waitForText(textOrRegex, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const found = await evaluate(`
      (() => {
        const text = ${JSON.stringify(textOrRegex)};
        return document.body.innerText.includes(text);
      })()
    `);
    if (found) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Timeout waiting for text: ${textOrRegex}`);
}

async function clickSelector(selector) {
  await waitForSelector(selector);
  await evaluate(`
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error("Element not found: " + ${JSON.stringify(selector)});
      el.scrollIntoView({ block: 'center' });
      el.click();
    })()
  `);
}

async function setInputValue(selector, value) {
  await waitForSelector(selector);
  await evaluate(`
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error("Element not found: " + ${JSON.stringify(selector)});
      el.focus();
      const proto = Object.getPrototypeOf(el);
      const set = Object.getOwnPropertyDescriptor(proto, 'value')?.set || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      if (set) {
        set.call(el, ${JSON.stringify(value)});
      } else {
        el.value = ${JSON.stringify(value)};
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()
  `);
}

async function selectOptionValue(selector, value) {
  await waitForSelector(selector);
  await evaluate(`
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error("Select not found: " + ${JSON.stringify(selector)});
      el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()
  `);
}

async function screenshot(filename) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const filepath = path.join(EVIDENCE_DIR, filename);
  await fs.writeFile(filepath, Buffer.from(data, 'base64'));
  console.log(`[Screenshot saved]: ${filepath}`);
}

async function cleanup() {
  console.log('\nCleaning up processes...');
  if (ws) {
    try { ws.close(); } catch (_) {}
  }
  if (chromeProcess) {
    try { chromeProcess.kill(); } catch (_) {}
  }
  if (viteProcess) {
    try { viteProcess.kill(); } catch (_) {}
  }
}

process.on('SIGINT', async () => { await cleanup(); process.exit(1); });
process.on('SIGTERM', async () => { await cleanup(); process.exit(1); });

async function runSuite() {
  console.log('=== NextStep Atlas + Proof Browser State Isolation Suite ===');
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });

  // 1. Launch Vite Dev Server
  console.log(`Starting Vite dev server on port ${PORT}...`);
  const clientDir = path.resolve('client');
  viteProcess = spawn('npm.cmd', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'], {
    cwd: clientDir,
    shell: true,
    stdio: 'ignore'
  });

  // Wait for Vite to respond
  let viteReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(APP_URL);
      if (res.status === 200) {
        viteReady = true;
        break;
      }
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!viteReady) throw new Error(`Vite failed to start on port ${PORT}`);
  console.log('✓ Vite dev server is responsive.');

  // 2. Launch Headless Chrome with remote debugging
  console.log(`Starting Headless Chrome on CDP port ${CDP_PORT}...`);
  chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${CHROME_USER_DATA}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900'
    ],
    { stdio: 'ignore' }
  );

  // Connect to Chrome
  let pageTarget = null;
  for (let i = 0; i < 30; i++) {
    try {
      const pRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' });
      pageTarget = await pRes.json();
      if (pageTarget?.webSocketDebuggerUrl) break;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!pageTarget) throw new Error('Failed to create page target on Chrome');
  console.log(`✓ Chrome Page Target created: ${pageTarget.id}`);

  ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => { ws.onopen = resolve; });
  console.log('✓ Connected to Chrome DevTools Protocol WebSocket.');

  // Enable domains
  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await send('Fetch.enable', {
    patterns: [
      { urlPattern: '*apiService.js*' }
    ]
  });

  // Request interception listener for apiService.js
  ws.addEventListener('message', async (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Fetch.requestPaused') {
      const { requestId, request } = data.params;
      if (request.url.includes('/src/services/apiService.js')) {
        await send('Fetch.fulfillRequest', {
          requestId,
          responseCode: 200,
          responseHeaders: [
            { name: 'Content-Type', value: 'application/javascript' }
          ],
          body: Buffer.from(fixtureModuleBody).toString('base64')
        });
      } else {
        await send('Fetch.continueRequest', { requestId });
      }
    }
  });

  // 3. Navigate to App and Sign In
  console.log(`Navigating to ${APP_URL}...`);
  await send('Page.navigate', { url: APP_URL });

  // Wait for either login form or workspace nav
  const startWait = Date.now();
  let foundSelector = null;
  while (Date.now() - startWait < 15000) {
    const hasNav = await evaluate(`Boolean(document.querySelector('.workspace-nav'))`);
    if (hasNav) {
      foundSelector = 'nav';
      break;
    }
    const hasEmail = await evaluate(`Boolean(document.querySelector('input[type=email]'))`);
    if (hasEmail) {
      foundSelector = 'email';
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  if (foundSelector === 'email') {
    console.log('Signing in with student.active@nextstep.local...');
    await setInputValue('input[type=email]', 'student.active@nextstep.local');
    await setInputValue('input[type=password]', 'password123');
    await clickSelector('button[type=submit]');
    await waitForSelector('.workspace-nav');
  } else {
    console.log('Session already active; landed on workspace navigation.');
  }

  console.log('✓ Workspace loaded successfully.');
  await screenshot('00-workspace-initial.png');

  // =========================================================================
  // SCENARIO 1: State Isolation Between Exercises A & B (Reflections)
  // =========================================================================
  console.log('\n--- Scenario 1: Reflection Isolation Between Exercises A & B ---');
  // Navigate to Proof tab
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('.workspace-nav button')).find(b => b.textContent.includes('Proof'));
      if (btn) btn.click();
    })()
  `);
  await waitForSelector('#view-proof');
  console.log('✓ Proof Studio view active.');

  // Ensure Topic is topic_arrays and Lesson is les_arrays_01 (Exercise A: ex_arrays_01)
  await selectOptionValue('#proof-topic-select', 'topic_arrays');
  await new Promise((r) => setTimeout(r, 200));
  await selectOptionValue('#proof-lesson-select', 'les_arrays_01');
  await waitForSelector('#proof-exercise-reflection');

  const refA = 'Exercise A Reflection: Track minimum price encountered so far and maximize profit.';
  console.log(`Setting Exercise A reflection: "${refA}"`);
  await setInputValue('#proof-exercise-reflection', refA);

  // Switch to Lesson 2 (les_arrays_02, Exercise B: ex_arrays_02)
  console.log('Switching to Exercise B (les_arrays_02: Product of Array Except Self)...');
  await selectOptionValue('#proof-lesson-select', 'les_arrays_02');
  await waitForSelector('#proof-exercise-reflection');

  // Verify Exercise B reflection does NOT have Exercise A's text
  const valBInitial = await evaluate(`document.querySelector('#proof-exercise-reflection').value`);
  assert.equal(valBInitial, '', 'Exercise B reflection must initially be empty and isolated from Exercise A!');
  console.log('✓ Exercise B reflection is clean (no leakage from Exercise A).');

  const refB = 'Exercise B Reflection: Maintain prefix product array and running suffix product.';
  console.log(`Setting Exercise B reflection: "${refB}"`);
  await setInputValue('#proof-exercise-reflection', refB);

  // Switch back to Exercise A (les_arrays_01)
  console.log('Switching back to Exercise A (les_arrays_01)...');
  await selectOptionValue('#proof-lesson-select', 'les_arrays_01');
  await waitForSelector('#proof-exercise-reflection');

  const valAReturned = await evaluate(`document.querySelector('#proof-exercise-reflection').value`);
  assert.equal(valAReturned, refA, 'Exercise A must preserve its exact reflection when returning!');
  console.log('✓ Exercise A retained its exact reflection.');

  // Switch back to Exercise B (les_arrays_02)
  console.log('Switching back to Exercise B (les_arrays_02)...');
  await selectOptionValue('#proof-lesson-select', 'les_arrays_02');
  await waitForSelector('#proof-exercise-reflection');

  const valBReturned = await evaluate(`document.querySelector('#proof-exercise-reflection').value`);
  assert.equal(valBReturned, refB, 'Exercise B must preserve its exact reflection when returning!');
  console.log('✓ Exercise B retained its exact reflection.');
  await screenshot('01-reflection-isolation.png');

  // =========================================================================
  // SCENARIO 2: Switching Lessons, Topics, and Input Variants
  // =========================================================================
  console.log('\n--- Scenario 2: Switching Lessons, Topics, and Input Variants ---');
  // Exercise B currently active. Check variant toggle button
  await waitForText('Try Alternate Input');
  console.log('Clicking "Try Alternate Input"...');
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Try Alternate Input'));
      if (btn) btn.click();
    })()
  `);
  await waitForText('Back to Primary Input');
  console.log('✓ Switched to Alternate Variant (Back to Primary Input button rendered).');

  console.log('Clicking "Back to Primary Input"...');
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back to Primary Input'));
      if (btn) btn.click();
    })()
  `);
  await waitForText('Try Alternate Input');
  console.log('✓ Successfully toggled back to Primary Input.');

  // Switch Topic to topic_hashing
  console.log('Switching topic to topic_hashing...');
  await selectOptionValue('#proof-topic-select', 'topic_hashing');
  await new Promise((r) => setTimeout(r, 300));

  // Verify Topic Hashing loaded Lesson 1 and Exercise ex_hashing_01
  await waitForText('Complement Lookup-Before-Insert');
  console.log('✓ Topic switched to Hashing; Complement Lookup-Before-Insert exercise rendered.');

  // Toggle variant on Hashing
  await waitForText('Try Alternate Input');
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Try Alternate Input'));
      if (btn) btn.click();
    })()
  `);
  await waitForText('Back to Primary Input');
  console.log('✓ Hashing alternate input toggled successfully.');
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Back to Primary Input'));
      if (btn) btn.click();
    })()
  `);
  await screenshot('02-topic-lesson-variant-switching.png');

  // =========================================================================
  // SCENARIO 3: Visit a Lesson Without an Attached Exercise
  // =========================================================================
  console.log('\n--- Scenario 3: Visit a Lesson Without an Attached Exercise ---');
  await selectOptionValue('#proof-topic-select', 'topic_arrays');
  await new Promise((r) => setTimeout(r, 200));

  // les_arrays_03 has no attached exercise
  console.log('Selecting les_arrays_03 (In-Place Compaction & Read/Write Pointer Partitioning)...');
  await selectOptionValue('#proof-lesson-select', 'les_arrays_03');
  await waitForText('In-Place Compaction');

  // Verify no interactive trace exercise is rendered
  const hasExerciseHeading = await evaluate(`Boolean(document.querySelector('#interactive-exercise-heading'))`);
  assert.equal(hasExerciseHeading, false, 'Lesson without exercise must NOT render interactive exercise heading');

  // Verify coherent empty state
  await waitForText('No Interactive Proof Trace Attached to this Lesson');
  console.log('✓ Verified: "No Interactive Proof Trace Attached to this Lesson" rendered cleanly.');

  // Verify lesson reflection is still accessible
  await waitForSelector('#lesson-reflection-input');
  await setInputValue('#lesson-reflection-input', 'Slow write pointer only advances on valid compaction element.');
  const lessonRefVal = await evaluate(`document.querySelector('#lesson-reflection-input').value`);
  assert.equal(lessonRefVal, 'Slow write pointer only advances on valid compaction element.');
  console.log('✓ Lesson reflection functions normally on exercise-free lessons.');
  await screenshot('03-lesson-without-exercise.png');

  // =========================================================================
  // SCENARIO 4: Simulate Delayed & Failed Evaluation Requests, Retry & State Isolation
  // =========================================================================
  console.log('\n--- Scenario 4: Simulated Evaluation Failure, Retry & State Isolation ---');
  // Return to les_arrays_01
  await selectOptionValue('#proof-lesson-select', 'les_arrays_01');
  await waitForSelector('#interactive-exercise-heading');

  // Arm test hook to simulate 500 network failure
  console.log('Arming test hook: window.__testControl.simulateStepEvalFail = true...');
  await evaluate(`window.__testControl.simulateStepEvalFail = true`);

  // Click first trace choice
  console.log('Clicking first trace checkpoint choice...');
  await evaluate(`
    (() => {
      const choiceGroup = document.querySelector('[aria-label="Trace step choices"]');
      const firstBtn = choiceGroup ? choiceGroup.querySelector('button') : null;
      if (firstBtn) firstBtn.click();
    })()
  `);

  // Verify role="alert" appears with error message and Retry button
  console.log('Waiting for evaluation error alert...');
  await waitForSelector('[role="alert"]');
  const alertText = await evaluate(`document.querySelector('[role="alert"]').innerText`);
  assert.ok(alertText.includes('Simulated evaluation network error 500'), 'Error alert must display evaluation failure message');
  assert.ok(alertText.includes('Retry Verification'), 'Alert must contain explicit Retry Verification button');
  console.log('✓ Evaluation error alert and [Retry Verification] button confirmed in DOM.');

  // Verify student choice is STILL selected
  const isChoiceSelected = await evaluate(`
    (() => {
      const choiceGroup = document.querySelector('[aria-label="Trace step choices"]');
      const firstBtn = choiceGroup ? choiceGroup.querySelector('button') : null;
      return firstBtn && firstBtn.className.includes('ui-border-accent');
    })()
  `);
  assert.ok(isChoiceSelected, 'Student choice selection must be preserved during evaluation failure!');
  console.log('✓ Student choice selection is preserved in state and DOM.');
  await screenshot('04a-eval-error-retry-visible.png');

  // Disarm failure and click Retry
  console.log('Disarming failure hook and clicking "Retry Verification"...');
  await evaluate(`window.__testControl.simulateStepEvalFail = false`);
  await evaluate(`
    (() => {
      const alertEl = document.querySelector('[role="alert"]');
      const retryBtn = alertEl ? alertEl.querySelector('button') : null;
      if (retryBtn) retryBtn.click();
    })()
  `);

  // Wait for evaluation feedback to render
  const startEvalWait = Date.now();
  let feedbackFound = false;
  while (Date.now() - startEvalWait < 10000) {
    feedbackFound = await evaluate(`
      (() => {
        const text = document.body.innerText;
        return text.includes('Correct State Transition') || text.includes('Misconception Detected');
      })()
    `);
    if (feedbackFound) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(feedbackFound, 'Evaluation retry must complete and render step feedback!');
  console.log('✓ Retry succeeded; evaluation feedback displayed.');
  await screenshot('04b-eval-retry-success.png');

  // Test Delayed Evaluation & Cross-Exercise Race Condition Isolation
  console.log('Testing delayed response and cross-exercise isolation...');
  await evaluate(`window.__testControl.simulateStepEvalDelayMs = 1500`);

  // Switch to step 2 or click another option on Exercise A
  await evaluate(`
    (() => {
      const choiceGroup = document.querySelector('[aria-label="Trace step choices"]');
      const btns = choiceGroup ? choiceGroup.querySelectorAll('button') : [];
      if (btns[1]) btns[1].click();
    })()
  `);

  // Immediately switch to Exercise B while Exercise A's request is pending in flight
  console.log('Immediately switching to Exercise B (les_arrays_02) while Exercise A evaluation is in flight...');
  await selectOptionValue('#proof-lesson-select', 'les_arrays_02');
  await waitForSelector('#interactive-exercise-heading');

  // Wait 2000ms for Exercise A's delayed response to resolve
  console.log('Waiting for delayed Exercise A evaluation to return in background...');
  await new Promise((r) => setTimeout(r, 2200));

  // Verify Exercise B is clean and was NOT contaminated
  const bTitle = await evaluate(`document.querySelector('#interactive-exercise-heading').innerText`);
  assert.ok(bTitle.includes('Exclusive Prefix & Suffix'), 'Exercise B heading must remain intact');
  const bRef = await evaluate(`document.querySelector('#proof-exercise-reflection').value`);
  assert.equal(bRef, refB, 'Exercise B reflection must not be mutated by Exercise A evaluation response');
  console.log('✓ Cross-exercise race condition prevention verified: Exercise B is completely isolated.');
  await evaluate(`window.__testControl.simulateStepEvalDelayMs = 0`);
  await screenshot('04c-race-condition-isolated.png');

  // =========================================================================
  // SCENARIO 5: Refresh, Direct Links, and Back/Forward Navigation
  // =========================================================================
  console.log('\n--- Scenario 5: Refresh, Direct Links, and Navigation ---');
  // Direct Link: Navigate to Practice view
  console.log(`Navigating directly to ${APP_URL}/dashboard?view=practice...`);
  await send('Page.navigate', { url: `${APP_URL}/dashboard?view=practice` });
  await waitForSelector('#view-practice [role="listitem"]');
  const practiceCount = await evaluate(`document.querySelectorAll('#view-practice [role="listitem"]').length`);
  assert.ok(practiceCount >= 10, 'Practice problem list must be rendered');
  console.log(`✓ Direct link to Practice view rendered ${practiceCount} items.`);

  // Direct Link: Navigate to Proof lesson via /learn/les_arrays_01
  console.log(`Navigating directly to ${APP_URL}/learn/les_arrays_01...`);
  await send('Page.navigate', { url: `${APP_URL}/learn/les_arrays_01` });
  await waitForSelector('#view-proof');
  const loadedLessonVal = await evaluate(`document.querySelector('#proof-lesson-select').value`);
  assert.equal(loadedLessonVal, 'les_arrays_01', 'Direct /learn/:lessonId link must select the target lesson');
  console.log('✓ Direct /learn/les_arrays_01 link loaded Proof Studio with les_arrays_01.');

  // Page Refresh
  console.log('Reloading page via Page.reload...');
  await send('Page.reload');
  await waitForSelector('#view-proof');
  const reloadedLessonVal = await evaluate(`document.querySelector('#proof-lesson-select').value`);
  assert.equal(reloadedLessonVal, 'les_arrays_01', 'Page reload must preserve active lesson and authenticated state');
  console.log('✓ Page refresh verified: user session and active lesson preserved.');

  // Back navigation: Go back to Practice view
  console.log('Testing back navigation (window.history.back())...');
  await evaluate(`window.history.back()`);
  await waitForSelector('#view-practice');
  console.log('✓ Back navigation returned to Practice Library.');
  await screenshot('05-refresh-and-navigation.png');

  console.log('\n============================================================');
  console.log('🎉 ALL BROWSER COVERAGE SCENARIOS PASSED WITH ZERO ERRORS!');
  console.log('============================================================\n');
}

runSuite()
  .then(async () => {
    await cleanup();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\n❌ BROWSER TEST SUITE FAILED:', err);
    await cleanup();
    process.exit(1);
  });
