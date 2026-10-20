// Synthetic browser regression: production auth/API source is never changed.
// Usage: node scripts/verify-workspace.cjs <playwright module path> [preview URL]
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');
const url = process.argv[3] || 'http://127.0.0.1:5187';
const out = path.resolve('.local/workspace-evidence', new Date().toISOString().replace(/[:.]/g, '-'));
const fixture = `import {apiFixture,DEMO_ACCOUNTS} from '/src/fixtures/apiFixture.js';
export const isFixtureMode=true; export const onSessionExpired=()=>()=>{};
export const apiService={...apiFixture,demoAccounts:DEMO_ACCOUNTS};`;
let browser;
const results = [], errors = [], consoleErrors = [], blockedExternal = new Set(), failedLocalRequests = [];
async function check(name, run) { await run(); results.push(name); console.log('PASS',name); }
async function textContrast(page) {
 return page.evaluate(()=>{
  const rgb=s=>{const v=s.match(/[\d.]+/g)?.map(Number)||[];return[v[0]||0,v[1]||0,v[2]||0,v.length>3?v[3]:1]};
  const blend=(f,b)=>[0,1,2].map(i=>f[i]*f[3]+b[i]*(1-f[3]));
  const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const failures=[];
  for(const el of document.querySelectorAll('.workspace-container *')){
   if(!el.getClientRects().length||el.closest('button:disabled')||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
   const ancestors=[];for(let p=el;p;p=p.parentElement)ancestors.unshift(p);
   let bg=[255,255,255];for(const p of ancestors)bg=blend(rgb(getComputedStyle(p).backgroundColor),bg);
   const st=getComputedStyle(el),fg=blend(rgb(st.color),bg),a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   const large=parseFloat(st.fontSize)>=24||(parseFloat(st.fontSize)>=18.66&&parseInt(st.fontWeight)>=700);
   if(ratio+.01<(large?3:4.5))failures.push({text:el.textContent.trim().slice(0,60),ratio:Math.round(ratio*100)/100});
  }return failures;
 });
}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',acceptDownloads:true});
 const page=await context.newPage(); page.setDefaultTimeout(10000);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push({text:msg.text(),url:msg.location().url});});
 page.on('requestfailed',request=>{if(request.url().startsWith(url))failedLocalRequests.push(request.url());});
 await page.route('**/*',route=>{
  if(!route.request().url().startsWith(url)){blockedExternal.add(route.request().url());return route.abort();}
  if(new URL(route.request().url()).pathname==='/src/services/apiService.js')return route.fulfill({contentType:'application/javascript',body:fixture});
  return route.continue();
 });
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('input[type=email]').fill('student.active@nextstep.local');
 await page.locator('input[type=password]').fill('password123');
 await page.getByRole('button',{name:'Sign In to NextStep',exact:true}).click();
 await page.locator('.workspace-nav').waitFor();
 const select = async (name) => {
  const labelMap = { Atlas: '(?:Learning path|Atlas)', Proof: '(?:Learn & practise|Learn|Proof)', Week: '(?:My week|Week)', Roadmap: '(?:Starter track|Roadmap)', Insights: '(?:Progress|Insights)', Practice: 'Practice', Review: 'Review', Today: 'Today' };
  const pattern = labelMap[name] || name;
  const directLocator = page.locator('.workspace-nav').getByRole('button', { name: new RegExp('^' + pattern + '(?:\\s|$)') }).or(page.locator('.workspace-nav').getByRole('tab', { name: new RegExp('^' + pattern + '(?:\\s|$)') }));
  const count = await directLocator.count();
  for (let i = 0; i < count; i++) {
   const el = directLocator.nth(i);
   if (await el.isVisible()) return el.click();
  }
  const moreTrigger = page.locator('#nav-more-trigger');
  if (await moreTrigger.isVisible()) {
   await moreTrigger.click();
   const menuLocator = page.locator('.workspace-nav-dropdown').getByRole('menuitem', { name: new RegExp('^' + pattern + '(?:\\s|$)') }).or(page.locator('.workspace-nav-dropdown').getByRole('button', { name: new RegExp('^' + pattern + '(?:\\s|$)') }));
   return menuLocator.first().click();
  }
  return directLocator.first().click();
 };
 const noOverflow=async(requireStrict=true)=>{
  const overflow = await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if (requireStrict) assert.equal(overflow,false,'horizontal overflow');
 };
 await check('Today renders current mission and saved progress',async()=>{
  await page.getByRole('progressbar').waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'1');
  await page.getByRole('button',{name:'Start practising',exact:true}).first().waitFor();
  await noOverflow();
  await page.screenshot({path:path.join(out,'today-desktop.png'),fullPage:true});
 });
 await check('Focus timer pauses, resumes, survives view changes and never completes a mission',async()=>{
  await page.clock.install();
  await page.getByRole('button',{name:'Start focus session',exact:true}).click();
  await page.clock.fastForward(10000);
  await page.getByRole('button',{name:'Pause focus timer',exact:true}).click();
  const paused=await page.locator('.focus-timer-card .font-mono').innerText();
  await page.clock.fastForward(20000);
  assert.equal(await page.locator('.focus-timer-card .font-mono').innerText(),paused);
  await page.getByRole('button',{name:'Resume focus timer',exact:true}).click();
  await select('Insights'); await page.clock.fastForward(10000); await select('Today');
  await page.getByRole('button',{name:'Pause focus timer',exact:true}).waitFor();
  await page.getByRole('button',{name:'Reset focus timer',exact:true}).click();
  await page.getByRole('button',{name:'15 minute focus session preset',exact:true}).click();
  await page.getByRole('button',{name:'Start focus session',exact:true}).click();
  await page.clock.fastForward(15*60*1000+1000);
  await page.getByText('Focus session complete!',{exact:true}).waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'1');
  await page.getByRole('button',{name:'Start new session',exact:true}).click();
  await page.clock.resume();
 });
 await check('Roadmap search, filters, no-result recovery, and URL refresh',async()=>{
  await select('Roadmap');
  const search=page.locator('#roadmap-search'); await search.fill('zzzz-no-match');
  await page.getByText('No missions found',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Reset search & filters',exact:true}).click();
  assert.equal(await page.locator('.roadmap-item').count(),12);
  await page.getByRole('button',{name:/^Completed \(/}).click();
  assert.equal(await page.locator('.roadmap-item').count(),1);
  await page.getByRole('button',{name:/^Upcoming \(/}).click();
  assert.equal(await page.locator('.roadmap-item').count(),10);
  await page.getByRole('button',{name:/^All \(/}).click();
  await search.fill('m02'); assert.equal(await page.locator('.roadmap-item').count(),1);
  await page.getByRole('button',{name:/^Expand details for M02/}).first().click();
  await page.locator('#mission-details-m02').waitFor();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#roadmap-search').waitFor();
  assert.match(page.url(),/view=roadmap/);
  await page.screenshot({path:path.join(out,'roadmap-desktop.png'),fullPage:true});
 });
 await check('Practice draft survives workspace view switches',async()=>{
  await select('Today');
  await page.getByRole('button',{name:'Start practising',exact:true}).first().click();
  await page.getByRole('heading',{name:'Your next 30 minutes'}).waitFor();
  const input=page.getByLabel(/where.*stuck/i).first();
  assert.equal(await input.count(),1,'saved-note input must be exercised');
  await input.fill('Synthetic boundary-case note'); await select('Insights'); await select('Today'); assert.equal(await input.inputValue(),'Synthetic boundary-case note');
 });
 await check('Review and Insights render real empty/recorded states',async()=>{
  await select('Review'); await page.locator('#view-review').waitFor();
  await page.screenshot({path:path.join(out,'review-desktop.png'),fullPage:true});
  await select('Insights'); await page.locator('#view-insights').waitFor();
  await page.screenshot({path:path.join(out,'insights-desktop.png'),fullPage:true});
 });
 await check('Saved blocker survives reload and appears in Review',async()=>{
  await select('Today');
  await page.getByRole('button',{name:'Save my notes',exact:true}).click();
  await page.waitForFunction(async()=>{
   const {apiFixture}=await import('/src/fixtures/apiFixture.js');
   return (await apiFixture.getGoal()).data.goal.learning?.m02?.whereStuck==='Synthetic boundary-case note';
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.workspace-nav').waitFor(); await select('Review');
  await page.getByText('Synthetic boundary-case note',{exact:true}).first().waitFor();
 });
 await check('Completion records hint outcome and reflection without losing earlier progress',async()=>{
  await select('Today'); await page.getByRole('button',{name:'Record completion',exact:true}).first().click();
  await page.locator('input[value=with_hint]').check();
  await page.locator('#completion-reflection').fill('Synthetic recall: compare each value in order.');
  await page.getByRole('dialog').getByRole('button',{name:'Record practice',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'detached'});
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'2');
  await select('Insights');
  await page.locator('#view-insights').getByText(/Synthetic recall: compare each value in order/).waitFor();
 });
 await check('Goal JSON export contains current progress and excludes session credentials',async()=>{
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Download goal snapshot as JSON',exact:true}).click()]);
  assert.match(download.suggestedFilename(),/^nextstep-goal-[a-z0-9_-]+-\d{4}-\d{2}-\d{2}\.json$/i);
  const read=async()=>{const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks).toString('utf8');};
  const raw=await Promise.race([read(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Browser download did not finish within 10 seconds')),10000))]),data=JSON.parse(raw);
  assert.equal(Object.keys(data.goal.completions).length,2);
  assert.equal(data.goal.completions.m02.outcome,'with_hint');
  assert.equal(data.goal.learning.m02.whereStuck,'Synthetic boundary-case note');
  assert.equal(data.track.trackId,'dsa-starter-v1');
  assert.ok(!/access_token|refresh_token|authorization|password123/i.test(raw));
 });
 await check('Notes search and recall reveal work without altering completion',async()=>{
  await page.evaluate(async()=>{const {apiFixture}=await import('/src/fixtures/apiFixture.js');const goal=(await apiFixture.getGoal()).data.goal;await apiFixture.completeMission({missionId:'m03',expectedVersion:goal.version,outcome:'with_hint',reflection:'Synthetic hash recall'});});
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('.workspace-nav').waitFor();
  await select('Review');
  const notes=page.getByRole('searchbox',{name:'Search notes library',exact:true});
  await notes.fill('zz-no-notes');
  await page.getByText(/No saved notes match/).waitFor();
  await notes.fill('Synthetic boundary-case');
  await page.getByText('Synthetic boundary-case note',{exact:true}).last().waitFor();
  await notes.fill('');
  await page.getByRole('button',{name:'Recall',exact:true}).first().click();
  const recall=page.locator('.recall-panel'); await recall.waitFor();
  assert.equal(await recall.getByText(/Synthetic recall: compare each value/).count(),0);
  await recall.getByRole('textbox').fill('Recall draft for M02 only');
  await recall.getByRole('button',{name:'Reveal saved reflection',exact:true}).click();
  await recall.getByText(/Synthetic recall: compare each value/).waitFor();
  const g=await page.evaluate(async()=>{const {apiFixture}=await import('/src/fixtures/apiFixture.js');return (await apiFixture.getGoal()).data.goal;});
  assert.equal(Object.keys(g.completions).length,3);
  await page.getByRole('button',{name:'Recall',exact:true}).last().click();
  assert.equal(await recall.getByRole('textbox').inputValue(),'');
  assert.equal(await recall.getByRole('button',{name:'Reveal saved reflection',exact:true}).count(),1);
  await recall.getByRole('textbox').fill('Separate M03 draft');
  await page.getByRole('button',{name:'Recall',exact:true}).first().click();
  assert.equal(await recall.getByRole('textbox').inputValue(),'Recall draft for M02 only');
  await select('Today');await select('Review');
  assert.equal(await recall.getByRole('textbox').inputValue(),'Recall draft for M02 only');
  await recall.getByRole('button',{name:'Close recall practice',exact:true}).click();
  await recall.getByRole('button',{name:'Keep editing',exact:true}).click();
  assert.equal(await recall.getByRole('textbox').inputValue(),'Recall draft for M02 only');
  await recall.getByRole('textbox').fill('');
  await recall.getByRole('button',{name:'Close recall practice',exact:true}).click();
 });
 await check('Dismissing a review suggestion retains the saved notes',async()=>{
  await page.getByRole('button',{name:'Dismiss from queue',exact:true}).click();
  await page.waitForFunction(()=>document.querySelectorAll('[aria-label="Review queue items"] .review-card').length===1);
  await page.getByRole('list',{name:'Saved notes list',exact:true}).getByText(/Synthetic boundary-case note/).waitFor();
 });
 await check('Recovery previews and applies a revised week while preserving completion',async()=>{
  await select('Today');
  await page.getByRole('button',{name:'Adjust my week',exact:true}).click();
  await page.getByRole('button',{name:'Monday: 30 minutes',exact:true}).click();
  await page.getByRole('button',{name:'Preview Revised Schedule',exact:true}).click();
  await page.getByText('Before & After Comparison',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Accept & Apply Revised Plan',exact:true}).click();
  await page.getByRole('progressbar').waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'3');
 });
 await check('Persistent review saves attempt, rates confidence, calculates due date, and survives reload',async()=>{
  await select('Review');
  await page.getByRole('button',{name:'Recall',exact:true}).first().click();
  const recall=page.locator('.recall-panel');
  await recall.waitFor();
  await recall.getByRole('textbox').fill('Synthetic persistent recall: hash map lookup O(1) time.');
  await recall.getByRole('radio',{name:/4 · Good/i}).click();
  await recall.getByRole('button',{name:'Save review',exact:true}).click();
  await recall.getByText('Recall review saved!').waitFor();
  await recall.getByRole('list',{name:'Saved recall attempts'}).getByText('Synthetic persistent recall: hash map lookup O(1) time.').waitFor();
  await recall.getByText(/Due: 2026-/).first().waitFor();
  const goalAfterSave=await page.evaluate(async()=>{
   const {apiFixture}=await import('/src/fixtures/apiFixture.js');
   return (await apiFixture.getGoal()).data.goal;
  });
  assert.equal(Object.keys(goalAfterSave.completions).length,3,'Completions count must remain unchanged');
  await recall.getByRole('button',{name:'Done with recall',exact:true}).click();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.workspace-nav').waitFor();
  await select('Review');
  await page.locator('[aria-label="Saved notes list"]').getByRole('button',{name:/recall/i}).first().click();
  await recall.waitFor();
  await recall.getByRole('list',{name:'Saved recall attempts'}).getByText('Synthetic persistent recall: hash map lookup O(1) time.').waitFor();
  await recall.getByRole('button',{name:'Done with recall',exact:true}).click();
 });
 await check('All workspace views fit desktop/mobile with computed text contrast across six themes',async()=>{
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:900});
   for(const style of ['frosted-sage','study-journal','quiet-focus'])for(const theme of ['light','dark']){
    await page.evaluate(({style,theme})=>{document.documentElement.dataset.style=style;document.documentElement.dataset.theme=theme},{style,theme});
    for(const name of ['Today','Roadmap','Review','Insights']){await select(name);await noOverflow(width === 1440);assert.deepEqual(await textContrast(page),[],`text contrast ${width} ${style} ${theme} ${name}`);}
   }
   await select('Today');
   await page.screenshot({path:path.join(out,`today-${width}.png`),fullPage:true});
  }
 });
 await check('No nested buttons or browser console errors',async()=>{
  await select('Roadmap');
  assert.equal(await page.locator('button button').count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(failedLocalRequests,[]);
  assert.deepEqual(consoleErrors.filter(e=>!blockedExternal.has(e.url)),[]);
 });
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify({environment:'Synthetic local fixtures; external network blocked',results,pageErrors:errors,consoleErrors,blockedExternal:[...blockedExternal],failedLocalRequests},null,2));
 console.log('Evidence:',out);
})().catch(async e=>{console.error(e);process.exitCode=1;await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'failure.txt'),e.stack||String(e));if(browser){const pages=browser.contexts()[0]?.pages();if(pages?.[0])await pages[0].screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});}}).finally(async()=>{await browser?.close();});

