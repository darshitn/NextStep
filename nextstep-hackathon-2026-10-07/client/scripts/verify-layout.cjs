// Browser-only fixture verification. The production API/auth adapter is never changed.
// Usage: node scripts/verify-layout.cjs <playwright module path> [preview URL]
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');
const url = process.argv[3] || 'http://127.0.0.1:5187';
const out = path.resolve('.local/layout-evidence');
const results = [];
const styles = ['frosted-sage', 'study-journal', 'quiet-focus'];
const labels = ['Frosted Sage', 'Study Journal', 'Quiet Focus'];
let browser;

const fixtureModule = `
import { apiFixture, DEMO_ACCOUNTS } from '/src/fixtures/apiFixture.js';
export const isFixtureMode = true;
export const onSessionExpired = () => () => {};
export const apiService = { ...apiFixture, demoAccounts: DEMO_ACCOUNTS,
 async getGuidance(payload) { if(window.qaFailGuidance) throw new Error('Fixture: guidance unavailable. Try again.'); const result = await apiFixture.getGuidance(payload); result.data.guidance.source = 'fixture'; return result; },
 async saveLearningContext(payload) { if(window.qaFailSave) throw new Error('Fixture: notes could not be saved.'); return apiFixture.saveLearningContext(payload); },
 async submitLearningCheck(payload) { if(window.qaFailCheck) throw new Error('Fixture: reasoning check unavailable. Your answer is preserved.'); const result = await apiFixture.submitLearningCheck(payload); result.data.assessment.source = 'fixture'; return result; },
 async completeMission(payload) { if(window.qaFailComplete) throw new Error('Fixture: completion could not be saved.'); return apiFixture.completeMission(payload); }
};`;

async function record(name, action) { await action(); results.push({ name, result: 'PASS' }); console.log('PASS', name); }
async function preferences(page, style, mode) {
  const before = await page.evaluate(() => scrollY);
  await page.getByRole('button', { name: 'Appearance', exact: true }).click();
  await page.getByText(labels[styles.indexOf(style)], { exact: true }).click();
  await page.getByRole('button', { name: mode === 'dark' ? 'Dark theme' : 'Light theme' }).click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.style), style);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), mode);
  const after = await page.evaluate(() => scrollY);
  assert.ok(Math.abs(after - before) <= 2, `appearance must preserve scroll: ${before} -> ${after}`);
}
async function focusPractice(page) {
  await page.getByRole('button', { name: 'Continue practising', exact: true }).first().click();
  await page.waitForTimeout(450);
  const measured = await page.evaluate(() => {
    const heading = document.querySelector('.practice-heading');
    return { heading: heading.getBoundingClientRect().top, bottom: document.querySelector('.app-header').getBoundingClientRect().bottom,
      focused: document.activeElement === heading, mission: document.querySelector('.mission-current').getBoundingClientRect().width,
      practice: document.querySelector('.practice-workspace').getBoundingClientRect().width };
  });
  assert.ok(measured.heading >= measured.bottom + 10, JSON.stringify(measured));
  assert.ok(measured.focused);
  assert.equal(Math.round(measured.mission), Math.round(measured.practice));
}
async function noOverflow(page) {
  const value = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
    bad: [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({tag:el.tagName,cls:el.className})).slice(0,5) }));
  assert.ok(value.scroll <= value.width, JSON.stringify(value));
}
async function contrast(page) {
  return page.evaluate(() => {
    const rgb = s => { const n = s.match(/[\d.]+/g)?.map(Number) || []; return [n[0]||0,n[1]||0,n[2]||0,n.length>3?n[3]:1]; };
    const blend = (f,b) => [0,1,2].map(i => f[i]*f[3]+b[i]*(1-f[3]));
    const luminance = c => c.slice(0,3).map(x => x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
    const failures = [], samples = [];
    for (const el of document.querySelectorAll('main *, .appearance-popover *')) {
      const collapsed = el.closest('details:not([open])');
      if (collapsed && !collapsed.querySelector('summary')?.contains(el)) continue;
      if (!el.getClientRects().length || el.closest('button:disabled') || ![...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim())) continue;
      const chain=[]; let p=el; while(p){chain.unshift(p);p=p.parentElement;}
      let bg=[255,255,255]; for(const ancestor of chain) bg=blend(rgb(getComputedStyle(ancestor).backgroundColor),bg);
      const st=getComputedStyle(el); const fg=blend(rgb(st.color),bg);
      const a=luminance(fg), b=luminance(bg), ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      const large=parseFloat(st.fontSize)>=24 || (parseFloat(st.fontSize)>=18.66 && parseInt(st.fontWeight)>=700);
      const text=el.textContent.trim().slice(0,70);
      if (ratio + .01 < (large?3:4.5)) failures.push({text,ratio:Math.round(ratio*100)/100,color:st.color,bg,font:st.fontSize});
      if(el.classList.contains('status-badge') || el.classList.contains('section-label')) samples.push({text,ratio:Math.round(ratio*100)/100});
    }
    return { failures, samples };
  });
}

(async () => {
  await fs.mkdir(out, { recursive:true });
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-gpu'] });
  const context = await browser.newContext({ viewport: {width:1440,height:1000}, reducedMotion:'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    if (!route.request().url().startsWith(url)) return route.abort();
    if (new URL(route.request().url()).pathname === '/src/services/apiService.js') return route.fulfill({contentType:'application/javascript',body:fixtureModule});
    return route.continue();
  });
  await page.goto(url);
  await page.locator('input[type=email]').fill('student.active@nextstep.local');
  await page.locator('input[type=password]').fill('password123');
  await page.getByRole('button',{name:'Sign In to NextStep',exact:true}).click();
  await page.getByRole('button',{name:'Start practising',exact:true}).first().waitFor();
  await page.evaluate(async () => {
    const {apiFixture} = await import('/src/fixtures/apiFixture.js');
    let g=(await apiFixture.getGoal()).data.goal;
    for(const missionId of ['m02','m03']) g=(await apiFixture.completeMission({missionId,expectedVersion:g.version,outcome:'independent'})).data.goal;
    g=(await apiFixture.saveLearningContext({missionId:'m02',expectedVersion:g.version,category:'need_revision',whatTried:'Compared present and absent targets.',whereStuck:'I want to revisit worst-case comparisons.',selfReportedStatus:'still_unsure'})).data.goal;
    await apiFixture.saveLearningContext({missionId:'m04',expectedVersion:g.version,category:'too_difficult',whatTried:'I traced the array [2, 5, 2] on paper.',whereStuck:'When should I check the set?',selfReportedStatus:'still_unsure'});
  });
  await page.getByTitle('Refresh saved goal').click();
  await page.getByRole('button',{name:'Continue practising',exact:true}).first().waitFor();
  await record('compact Appearance keyboard navigation and Escape focus return', async () => {
    await page.getByRole('button',{name:'Appearance',exact:true}).click();
    assert.equal(await page.locator('input[type=radio]:focus').inputValue(), 'frosted-sage');
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.style), 'study-journal');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator(':focus').innerText(), 'Appearance');
  });
  const matrix=[];
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:width===1440?1000:844});
    for(const style of styles) for(const mode of ['light','dark']) {
      await preferences(page,style,mode);
      await page.evaluate(()=>scrollTo(0,0));
      await noOverflow(page);
      await page.screenshot({path:path.join(out,`${style}-${mode}-${width}-dashboard.png`),fullPage:true});
      await page.locator('.saved-context summary').click();
      assert.deepEqual((await contrast(page)).failures, [], 'saved context status contrast');
      await page.locator('.saved-context summary').click();
      await focusPractice(page);
      await page.locator('#blocker-where-stuck').fill('Draft preserved while changing appearance.');
      // Capture the same workspace in each palette; both notes and exercise stay mounted.
      await preferences(page,style,mode);
      assert.equal(await page.locator('#blocker-where-stuck').inputValue(),'Draft preserved while changing appearance.');
      await noOverflow(page);
      const colors=await contrast(page);
      assert.deepEqual(colors.failures,[],`Contrast ${style} ${mode} ${width}: ${JSON.stringify(colors.failures)}`);
      const cell=await page.locator('.ns-heat-cell').first().boundingBox();
      assert.equal(cell.width,cell.height); assert.ok(cell.width>=24 && cell.width<=28);
      await focusPractice(page);
      await page.screenshot({path:path.join(out,`${style}-${mode}-${width}-practice.png`)});
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:path.join(out,`${style}-${mode}-${width}-practice-full.png`),fullPage:true});
      matrix.push({style,mode,width,contrast:colors.samples,result:'PASS'});
      await page.locator('#blocker-where-stuck').fill('When should I check the set?');
      await page.getByRole('button',{name:'Close practice',exact:true}).click();
      assert.equal(await page.locator('.practice-workspace').count(),0);
    }
  }
  results.push({name:'12 style/mode/viewport combinations: layout, colors, square activity cells, drafts, focus and scroll',result:'PASS'});
  await page.setViewportSize({width:390,height:844});
  await focusPractice(page);
  const trace=page.getByLabel('Interactive Duplicate Check Trace', {exact:true});
  await record('M04 wrong prediction does not advance; correct trace and alternate array work', async () => {
    await trace.getByRole('button',{name:/Yes, already seen/}).click();
    assert.match(await trace.innerText(), /Step 1: Inspecting index 0/);
    await trace.getByRole('button',{name:/No, not seen yet/}).click();
    await trace.getByRole('button',{name:/No, not seen yet/}).click();
    await trace.getByRole('button',{name:/Yes, already seen/}).click();
    assert.match(await trace.innerText(),/Duplicate Found at Index 2/);
    await trace.getByRole('button',{name:'Check your reasoning',exact:true}).click();
    const check=await page.locator('#curated-check-answer').boundingBox();
    assert.ok(check.y>64);
    await trace.getByRole('button',{name:'Try alternate array [4, 1, 4]',exact:true}).click();
    await trace.getByRole('button',{name:/No, not seen yet/}).click();
    await trace.getByRole('button',{name:/No, not seen yet/}).click();
    await trace.getByRole('button',{name:/Yes, already seen/}).click();
    assert.match(await trace.innerText(),/\{ 4, 1 \}/);
    for (const style of styles) for (const mode of ['light','dark']) {
      await preferences(page,style,mode);
      assert.deepEqual((await contrast(page)).failures, [], `trace feedback contrast: ${style} ${mode}`);
    }
  });
  await record('appearance changes preserve exercise, answer and notes drafts', async () => {
    await page.locator('#curated-check-answer').fill('At index 2, the set contains 2 and 5 before checking the duplicate.');
    await page.locator('#blocker-where-stuck').fill('Unsaved draft');
    await preferences(page,'quiet-focus','light');
    assert.match(await trace.innerText(),/Duplicate Found at Index 2/);
    assert.equal(await page.locator('#blocker-where-stuck').inputValue(),'Unsaved draft');
    assert.match(await page.locator('#curated-check-answer').inputValue(),/^At index 2/);
  });
  await record('failed guidance and reasoning checks display errors and retain input', async () => {
    await page.evaluate(()=>{window.qaFailGuidance=true;window.qaFailCheck=true;});
    await page.getByRole('button',{name:'Help me get unstuck',exact:true}).click();
    await page.getByText('Fixture: guidance unavailable. Try again.',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Check my reasoning',exact:true}).click();
    await page.getByText('Fixture: reasoning check unavailable. Your answer is preserved.',{exact:true}).waitFor();
    assert.match(await page.locator('#curated-check-answer').inputValue(),/^At index 2/);
    assert.equal(await page.locator('#blocker-where-stuck').inputValue(),'Unsaved draft');
    await page.evaluate(()=>{window.qaFailGuidance=false;window.qaFailCheck=false;});
  });
  await record('fixture guidance and reasoning feedback render without changing completed work', async () => {
    const before = await page.evaluate(async () => {
      const {apiFixture} = await import('/src/fixtures/apiFixture.js');
      const g=(await apiFixture.getGoal()).data.goal;
      return JSON.stringify({completions:g.completions,xp:g.xp,schedule:g.schedule});
    });
    await page.getByRole('button',{name:'Help me get unstuck',exact:true}).click();
    await page.getByText('Source: fixture',{exact:true}).waitFor();
    await page.getByRole('button',{name:'Check my reasoning',exact:true}).click();
    await page.getByText('Coaching Feedback:',{exact:true}).waitFor();
    const after = await page.evaluate(async () => {
      const {apiFixture} = await import('/src/fixtures/apiFixture.js');
      const g=(await apiFixture.getGoal()).data.goal;
      return JSON.stringify({completions:g.completions,xp:g.xp,schedule:g.schedule});
    });
    assert.equal(before,after);
    await page.getByRole('button',{name:'Refine Answer & Try Again',exact:true}).click();
    assert.match(await page.locator('#curated-check-answer').inputValue(),/^At index 2/);
  });
  await record('both close controls protect unsaved notes; failed save retains them', async () => {
    await page.getByRole('button',{name:'Close practice',exact:true}).click();
    await page.getByRole('button',{name:'Keep editing',exact:true}).click();
    assert.equal(await page.locator('#blocker-where-stuck').inputValue(),'Unsaved draft');
    await page.getByRole('button',{name:'Close practice panel',exact:true}).click();
    await page.evaluate(()=>{window.qaFailSave=true;});
    await page.getByRole('button',{name:'Save and close',exact:true}).click();
    await page.getByText('Fixture: notes could not be saved.',{exact:true}).waitFor();
    assert.equal(await page.locator('.practice-workspace').count(),1);
    assert.equal(await page.locator('#blocker-where-stuck').inputValue(),'Unsaved draft');
    await page.evaluate(()=>{window.qaFailSave=false;});
    await page.getByRole('button',{name:'Save and close',exact:true}).click();
    await page.locator('.practice-workspace').waitFor({state:'detached'});
  });
  await record('saved context readiness, earlier ownership, resume, dismiss and mission-switch protection', async () => {
    await page.locator('.saved-context summary').click();
    await page.getByRole('button',{name:'Still unsure · Change',exact:true}).click();
    await page.getByRole('button',{name:'Ready to practise · Change',exact:true}).waitFor();
    await page.getByRole('button',{name:'Dismiss saved notes reminder',exact:true}).click();
    await page.getByText('Earlier mission m02',{exact:false}).waitFor();
    await page.getByRole('button',{name:'Resume M02',exact:true}).click();
    await page.locator('#blocker-where-stuck').fill('Earlier mission draft');
    await page.getByRole('button',{name:'Continue practising',exact:true}).first().click();
    await page.getByRole('button',{name:'Keep editing',exact:true}).click();
    assert.equal(await page.locator('#blocker-where-stuck').inputValue(),'Earlier mission draft');
    await page.getByRole('button',{name:'Continue practising',exact:true}).first().click();
    await page.getByRole('button',{name:'Discard changes',exact:true}).click();
    await page.getByLabel('Interactive Duplicate Check Trace',{exact:true}).waitFor();
    assert.equal(await page.locator('#blocker-where-stuck').inputValue(),'Unsaved draft');
    await page.getByRole('button',{name:'Close practice',exact:true}).click();
  });
  await record('calendar navigation, date selection and activity keyboard navigation', async () => {
    const text=await page.locator('.ns-calendar>.ns-muted').innerText();
    await page.getByRole('button',{name:'Next week',exact:true}).click();
    assert.notEqual(await page.locator('.ns-calendar>.ns-muted').innerText(),text);
    await page.getByRole('button',{name:'Previous week',exact:true}).click();
    assert.equal(await page.locator('.ns-calendar>.ns-muted').innerText(),text);
    await page.locator('.ns-week button').first().click();
    assert.equal(await page.locator('.ns-week button[aria-pressed=true]').count(),1);
    const heat=page.locator('.ns-heat-cell[tabindex="0"]');
    const day=await heat.getAttribute('data-day');
    await heat.focus(); await page.keyboard.press('ArrowUp');
    assert.notEqual(await page.locator('.ns-heat-cell:focus').getAttribute('data-day'),day);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.ns-heat-cell:focus').getAttribute('aria-pressed'),'true');
    await page.getByRole('button',{name:'Today',exact:true}).click();
  });
  await record('expanded roadmap across all six appearances', async () => {
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('.roadmap summary').click();
    for(const style of styles) for(const mode of ['light','dark']) {
      await preferences(page,style,mode);
      assert.deepEqual((await contrast(page)).failures, [], `roadmap contrast: ${style} ${mode}`);
      await noOverflow(page);
    }
    await page.locator('.roadmap summary').click();
  });
  await record('320px overflow, reduced motion and completion dialog keyboard handling', async () => {
    await page.setViewportSize({width:320,height:740});
    for(const style of styles) for(const mode of ['light','dark']) {
      await preferences(page,style,mode); await noOverflow(page); await focusPractice(page); await noOverflow(page);
      const duration=await page.locator('.progress-track>div').evaluate(el=>getComputedStyle(el).transitionDuration);
      assert.ok(duration==='0s'||duration==='1e-05s');
      await page.getByRole('button',{name:'Close practice',exact:true}).click();
    }
    await page.getByRole('button',{name:'Record completion',exact:true}).first().click();
    await page.getByRole('dialog').waitFor();
    assert.equal(await page.locator('input[type=radio]:focus').inputValue(),'independent');
    await page.locator('#completion-reflection').fill('Checked before inserting into the set.');
    await page.getByRole('button',{name:'Record practice',exact:true}).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Close completion form');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(),0);
  });
  await record('completion failure retains reflection; confirmed fixture completion updates progress', async () => {
    await page.getByRole('button',{name:'Record completion',exact:true}).first().click();
    await page.locator('#completion-reflection').fill('Checked before inserting into the set.');
    await page.evaluate(()=>{window.qaFailComplete=true;});
    await page.getByRole('button',{name:'Record practice',exact:true}).click();
    await page.getByRole('dialog').getByRole('alert').waitFor();
    assert.equal(await page.locator('#completion-reflection').inputValue(),'Checked before inserting into the set.');
    await page.evaluate(()=>{window.qaFailComplete=false;});
    await page.getByRole('button',{name:'Record practice',exact:true}).click();
    await page.getByRole('dialog').waitFor({state:'detached'});
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'4');
  });
  await record('recovery preview retains completed work and requires explicit apply', async () => {
    await page.getByRole('button',{name:'Adjust my week',exact:true}).click();
    await page.getByRole('button',{name:'Monday: 30 minutes',exact:true}).click();
    await page.getByRole('button',{name:'Preview Revised Schedule',exact:true}).click();
    await page.getByText('Before & After Comparison',{exact:true}).waitFor();
    await noOverflow(page);
    await page.screenshot({path:path.join(out,'320-recovery-preview.png'),fullPage:true});
    await page.getByRole('button',{name:'Accept & Apply Revised Plan',exact:true}).click();
    await page.getByRole('button',{name:'Record completion',exact:true}).first().waitFor();
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'4');
  });
  await record('appearance and fixture progress survive reload', async () => {
    await preferences(page,'study-journal','dark');
    await page.reload();
    await page.getByRole('button',{name:'Record completion',exact:true}).first().waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.style),'study-journal');
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
    assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'4');
  });
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify({environment:'LOCAL FIXTURE; no real auth, AI or database calls',results,matrix,pageErrors:errors},null,2));
  console.log('Evidence:',out);
})().catch(async e => {
  console.error(e);
  await fs.mkdir(out,{recursive:true});
  await fs.writeFile(path.join(out,'failure.txt'),String(e.stack||e));
  process.exitCode=1;
}).finally(async()=>{await browser?.close();});
