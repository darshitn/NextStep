// Read-only preflight; no dependency install, env-value reads, process termination, or cloud writes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = false;
console.log('Kit: ' + root);
const executeOptions = { encoding: 'utf8', timeout: 15000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] };
for (const name of ['node', 'npm', 'git']) {
  try {
    let result;
    if (name === 'node') result = execFileSync(process.execPath, ['--version'], executeOptions);
    else if (name === 'npm' && process.platform === 'win32') {
      result = execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'npm.cmd --version'], executeOptions);
    } else result = execFileSync(name, ['--version'], executeOptions);
    console.log('OK ' + name + ': ' + result.trim());
  } catch {
    failed = true;
    console.log('FAIL ' + name + ' version check. Verify installation/PATH and reopen the terminal.');
  }
}
const [major] = process.versions.node.split('.').map(Number);
if (major !== 24) console.log('NOTE: this kit aligns with Darshit on Node 24.x. Agree a supported version on both laptops/hosts before scaffolding.');

for (const component of ['client', 'server']) {
  const filename = path.join(root, component, 'package.json');
  if (!fs.existsSync(filename)) {
    console.log('NOT IMPLEMENTED: ' + component + '/package.json (expected before scaffold)');
    continue;
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
    for (const script of component === 'client' ? ['dev', 'build', 'preview'] : ['dev', 'start', 'test']) {
      if (!manifest.scripts?.[script]) { failed = true; console.log('FAIL missing ' + component + ' script: ' + script); }
    }
    console.log('FOUND ' + component + ' manifest; dependencies and tests are not checked here.');
  } catch { failed = true; console.log('FAIL cannot parse ' + component + '/package.json'); }
}
for (const relative of ['client/.env.local', 'server/.env']) {
  console.log(relative + ' exists: ' + fs.existsSync(path.join(root, relative)) + ' (contents not read)');
}

if (process.platform === 'win32') {
  try {
    const command = 'Get-NetTCPConnection -State Listen -LocalPort 3001,5173 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess | ConvertTo-Json -Compress';
    const ports = execFileSync('powershell.exe', ['-NoProfile', '-Command', command], executeOptions).trim();
    console.log(ports ? 'Visible port listeners: ' + ports : 'No visible listeners on 3001/5173. Expected before starting the app.');
  } catch { console.log('Port inventory unavailable; inspect the known app terminals manually.'); }
}

const args = process.argv.slice(2);
const unknownArgs = args.filter((item, index) => !['--check-api', '--api-base'].includes(item) && args[index - 1] !== '--api-base');
if (unknownArgs.length || (args.includes('--api-base') && !args[args.indexOf('--api-base') + 1])) {
  failed = true;
  console.log('Usage: node scripts/preflight.mjs [--check-api] [--api-base https://your-api-origin]');
} else if (args.includes('--check-api')) {
  try {
    const value = args.includes('--api-base') ? args[args.indexOf('--api-base') + 1] : 'http://localhost:3001';
    const base = new URL(value);
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error('Use an origin only');
    const response = await fetch(new URL('/api/health', base), { signal: AbortSignal.timeout(15000) });
    const health = await response.json();
    if (!response.ok || health.ok !== true || health.service !== 'nextstep-api' || health.apiVersion !== 1) throw new Error('Health shape mismatch');
    console.log('PASS API health shape only. Auth/database/persistence remain untested.');
  } catch {
    failed = true;
    console.log('FAIL health check. Check the plain origin, service status, and API-v1 JSON response.');
  }
}

console.log('Read-only preflight complete. Nothing installed, stopped, or deployed.');
process.exitCode = failed ? 1 : 0;
