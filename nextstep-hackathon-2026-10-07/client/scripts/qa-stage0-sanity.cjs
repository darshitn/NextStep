const { chromium } = require('D:/Projects/Deadline-Catcher/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

const EVIDENCE_DIR = path.resolve(__dirname, '../.local/full-local-qa/2026-10-21T11-48-00Z');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

(async () => {
  console.log('--- STAGE 0: SANITY CHECK ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const pageErrors = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

  const title = await page.title();
  console.log('Page Title:', title);

  const screenshotPath = path.join(EVIDENCE_DIR, '00-initial-load.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Initial screenshot saved to:', screenshotPath);

  const fixtureModeIndicators = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasDemoAccounts = text.includes('Demo Accounts') || text.includes('Synthetic') || text.includes('Fixture');
    const demoButtons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t.includes('@') || t.includes('Demo'));
    return { hasDemoAccounts, demoButtons, textSnippet: text.slice(0, 200) };
  });

  console.log('Fixture Indicators:', fixtureModeIndicators);
  console.log('Console Logs count:', consoleLogs.length);
  console.log('Page Errors count:', pageErrors.length);

  await browser.close();
  console.log('--- STAGE 0 SANITY CHECK COMPLETE ---');
})();
