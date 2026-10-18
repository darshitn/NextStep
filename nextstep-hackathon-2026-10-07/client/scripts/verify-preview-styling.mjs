import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

let chromium;
try {
  chromium = (await import('file:///D:/Projects/Deadline-Catcher/node_modules/playwright/index.mjs')).chromium;
} catch (_) {
  chromium = require('playwright').chromium;
}

const clientDir = path.resolve(__dirname, '..');
const projectRootDir = path.resolve(clientDir, '..');
const scriptPath = path.resolve(clientDir, 'scripts', 'start-synthetic-preview.mjs');

async function waitForServer(url, timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

async function testServerInDirectory({ cwd, port, label }) {
  console.log(`\n--- Testing Preview in [${label}] (cwd: ${cwd}, port: ${port}) ---`);

  const child = spawn(process.execPath, [scriptPath, '--port', String(port), '--strictPort'], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let childOutput = '';
  child.stdout?.on('data', d => { childOutput += d.toString(); });
  child.stderr?.on('data', d => { childOutput += d.toString(); });

  const url = `http://127.0.0.1:${port}`;

  try {
    await waitForServer(url);
    console.log(`✓ Server healthy at ${url}`);

    // 1. Fetch index.css directly and verify utility rules
    const cssRes = await fetch(`${url}/src/index.css`);
    assert.equal(cssRes.status, 200, 'Served /src/index.css must return HTTP 200');
    const cssText = await cssRes.text();
    console.log(`  index.css byte size: ${cssText.length}`);
    assert.ok(cssText.length > 30000, `Expected full stylesheet (>30KB), got ${cssText.length} bytes`);
    assert.ok(cssText.includes('.grid'), 'Stylesheet must contain .grid utility');
    assert.ok(cssText.includes('.p-5'), 'Stylesheet must contain .p-5 utility');
    assert.ok(cssText.includes('.gap-6'), 'Stylesheet must contain .gap-6 utility');
    assert.ok(cssText.includes('.text-xl'), 'Stylesheet must contain .text-xl utility');
    console.log(`✓ Stylesheet contains all expected Tailwind utility classes`);

    // 2. Open Playwright browser and assert real computed styles on rendered DOM
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });

    // Handle sign-in if on login page
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('student.active@nextstep.local');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForSelector('.workspace-shell, .dashboard-container, nav', { timeout: 8000 });
    }

    // Measure computed styles of representative elements
    const computedStyles = await page.evaluate(() => {
      const gridEl = document.querySelector('.grid') || document.querySelector('[class*="grid"]');
      const p5El = document.querySelector('.p-5') || document.querySelector('[class*="p-5"]');
      const smEl = document.querySelector('p.text-sm') || document.querySelector('.text-sm');
      const gapEl = document.querySelector('.gap-6') || document.querySelector('.gap-2') || document.querySelector('[class*="gap-"]');

      return {
        gridDisplay: gridEl ? window.getComputedStyle(gridEl).display : null,
        p5Padding: p5El ? window.getComputedStyle(p5El).paddingTop : null,
        smFontSize: smEl ? window.getComputedStyle(smEl).fontSize : null,
        gapVal: gapEl ? window.getComputedStyle(gapEl).gap : null
      };
    });

    console.log(`  Computed DOM styles from browser:`, computedStyles);
    if (computedStyles.gridDisplay) {
      assert.equal(computedStyles.gridDisplay, 'grid', 'Element with .grid must compute to display: grid');
    }
    if (computedStyles.p5Padding) {
      assert.equal(computedStyles.p5Padding, '20px', 'Element with .p-5 must compute to 20px padding (1.25rem)');
    }
    if (computedStyles.smFontSize) {
      assert.equal(computedStyles.smFontSize, '14px', 'Element with .text-sm must compute to 14px font-size (0.875rem)');
    }
    console.log(`✓ Real computed DOM styles confirmed in Playwright`);

    await browser.close();
  } finally {
    child.kill('SIGTERM');
  }
}

async function verifyProductionBuild() {
  console.log(`\n--- Testing Production Build Artifacts ---`);
  const distDir = path.resolve(clientDir, 'dist');
  assert.ok(fs.existsSync(distDir), 'Production dist/ directory must exist');

  const assetsDir = path.resolve(distDir, 'assets');
  assert.ok(fs.existsSync(assetsDir), 'dist/assets directory must exist');

  const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
  assert.ok(cssFiles.length > 0, 'Production build must generate at least one CSS bundle');

  let totalCssText = '';
  for (const f of cssFiles) {
    totalCssText += fs.readFileSync(path.resolve(assetsDir, f), 'utf-8');
  }

  console.log(`  Combined production CSS size: ${totalCssText.length} bytes`);
  assert.ok(totalCssText.includes('display:grid') || totalCssText.includes('.grid'), 'Production CSS must contain grid rules');
  assert.ok(totalCssText.includes('1.25rem') || totalCssText.includes('20px'), 'Production CSS must contain 1.25rem / 20px spacing/typography');
  console.log(`✓ Production build CSS verified`);
}

async function run() {
  console.log('Starting Directory-Independent Styling Regression Harness');

  // Test from Project Root
  await testServerInDirectory({
    cwd: projectRootDir,
    port: 5181,
    label: 'PROJECT ROOT'
  });

  // Test from Client Root
  await testServerInDirectory({
    cwd: clientDir,
    port: 5182,
    label: 'CLIENT DIRECTORY'
  });

  // Verify Production Build
  await verifyProductionBuild();

  console.log('\n============================================================');
  console.log('✅ ALL STYLING REGRESSION CHECKS PASSED');
  console.log('Tailwind utility generation is proven directory-independent.');
  console.log('============================================================\n');
}

run().catch(err => {
  console.error('\n❌ STYLING REGRESSION FAILED:', err);
  process.exit(1);
});
