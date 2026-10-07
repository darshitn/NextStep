// Planning-kit checks only. This does not test a NextStep application or a cloud service.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
let checks = 0;
function check(name, fn) {
  try { fn(); checks += 1; console.log('PASS ' + name); }
  catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL ' + name + ': ' + error.message); }
}
function readJson(relative) { return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8')); }
function filesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git', 'dist', '.local'].includes(entry.name)) return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(full) : [full];
  });
}

const required = [
  'README.md', 'AGENTS.md', 'docs/01-product-scope.md', 'docs/02-team-sync.md',
  'docs/03-platform-setup.md', 'docs/04-troubleshooting.md', 'docs/05-audit-and-tests.md',
  'docs/06-deployment-and-release.md', 'docs/07-sources.md',
  'roles/DARSHIT.md', 'roles/SANKIRTH.md', 'roles/HARSHITA.md',
  'contracts/API-V1.md', 'contracts/ARCHITECTURE.md', 'contracts/SCHEDULER.md',
  'prompts/DARSHIT-ANTIGRAVITY.md', 'prompts/SANKIRTH-ANTIGRAVITY.md',
  'prompts/AUDIT-AND-RESUME.md', 'presentation/PITCH-AND-DEMO.md',
  'handoffs/DARSHIT.md', 'handoffs/SANKIRTH.md', 'handoffs/HARSHITA.md',
  'templates/client.env.example', 'templates/server.env.example',
  'templates/001-nextstep-goals.sql', 'scripts/Test-WorkshopSetup.ps1', 'scripts/preflight.mjs'
];
check('required planning files exist', () => {
  for (const relative of required) assert.ok(fs.existsSync(path.join(root, relative)), relative);
});

check('relative Markdown links resolve inside kit', () => {
  for (const file of filesBelow(root).filter(file => file.endsWith('.md'))) {
    const body = fs.readFileSync(file, 'utf8');
    for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const href = match[1].split('#')[0];
      if (!href || /^[a-z]+:/i.test(href)) continue;
      const target = path.resolve(path.dirname(file), decodeURIComponent(href));
      assert.ok(target === root || target.startsWith(root + path.sep), 'Link escapes kit: ' + href);
      assert.ok(fs.existsSync(target), path.relative(root, file) + ' -> ' + href);
    }
  }
});

let catalogue;
check('catalogue has twelve ordered 30-minute missions', () => {
  catalogue = readJson('fixtures/dsa-starter.json');
  assert.equal(catalogue.trackId, 'dsa-starter-v1');
  assert.equal(catalogue.missions.length, 12);
  assert.equal(catalogue.missions.reduce((sum, mission) => sum + mission.minutes, 0), 360);
  assert.equal(catalogue.estimatedMinutes, 360);
  assert.equal(new Set(catalogue.missions.map(m => m.id)).size, 12);
  catalogue.missions.forEach((mission, index) => {
    assert.equal(mission.minutes, 30);
    assert.deepEqual(mission.prerequisites, index ? [catalogue.missions[index - 1].id] : []);
    assert.ok(mission.title && mission.why && mission.doneWhen && mission.steps.length);
    if (mission.resourceUrl) assert.equal(new URL(mission.resourceUrl).protocol, 'https:');
  });
});

function referenceDates(start, availability, count, completedTodayMinutes = 0) {
  // Tiny independent arithmetic check for documentation fixtures, not an app planner.
  const names = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const cursor = new Date(start + 'T12:00:00Z');
  const dates = [];
  for (let day = 0; day < 366 && dates.length < count; day += 1) {
    const minutes = Math.max(0, availability[names[cursor.getUTCDay()]] - (day === 0 ? completedTodayMinutes : 0));
    const slots = Math.floor(minutes / 30);
    for (let slot = 0; slot < slots && dates.length < count; slot += 1) dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  assert.equal(dates.length, count, 'Reference workload must fit horizon');
  return dates;
}

check('initial request and full response agree', () => {
  const request = readJson('fixtures/create-goal.request.json');
  const goal = readJson('fixtures/initial-goal.response.json').data.goal;
  assert.equal(goal.trackId, request.trackId);
  assert.deepEqual(goal.availability, request.availability);
  const expected = referenceDates(request.planStartDate, request.availability, 12);
  assert.deepEqual(goal.schedule.map(item => item.date), expected);
  assert.deepEqual(goal.schedule.map(item => item.missionId), catalogue.missions.map(item => item.id));
  assert.equal(goal.estimatedFinishDate, expected.at(-1));
  assert.equal(goal.remainingMinutes, 360);
  assert.equal(goal.xp, 0);
  assert.equal(goal.level, 1);
  assert.equal(goal.nextMissionId, 'm01');
});

check('documented recovery dates are arithmetically correct', () => {
  const availability = { mon: 30, tue: 0, wed: 30, thu: 0, fri: 30, sat: 0, sun: 0 };
  assert.equal(referenceDates('2026-10-07', availability, 12).at(-1), '2026-11-02');
  assert.equal(referenceDates('2026-10-07', availability, 10, 60).at(-1), '2026-10-30');
});

check('environment templates contain placeholders, not privileged keys', () => {
  for (const relative of ['templates/client.env.example', 'templates/server.env.example']) {
    const values = fs.readFileSync(path.join(root, relative), 'utf8').split(/\r?\n/).filter(line => line && !line.startsWith('#'));
    for (const line of values) {
      assert.ok(!/^(VITE_)?(SUPABASE_)?(SERVICE_ROLE|SECRET|PASSWORD|DATABASE_URL)/.test(line));
      assert.ok(!/eyJ[A-Za-z0-9_-]{20,}/.test(line), 'Unexpected JWT-like value');
    }
  }
});

check('draft SQL enables RLS and has no destructive table statement', () => {
  const sql = fs.readFileSync(path.join(root, 'templates/001-nextstep-goals.sql'), 'utf8').replace(/--[^\n]*/g, '');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /unique \(owner_id\)/i);
  assert.equal((sql.match(/create policy/gi) || []).length, 3);
  assert.ok(!/\b(drop|truncate)\s+table\b/i.test(sql));
});

console.log('\nPlanning-kit groups passed: ' + checks + '; failed: ' + failures.length + '.');
console.log('No app, remote SQL, browser flow, RLS execution, or deployment was tested by this script.');
process.exitCode = failures.length ? 1 : 0;
