import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

// 1. Verify working directory integrity
const clientPkgPath = path.resolve(clientRoot, 'package.json');
if (!fs.existsSync(clientPkgPath)) {
  console.error(`Error: start-synthetic-preview must be run from a valid client root directory. Not found: ${clientPkgPath}`);
  process.exit(1);
}

const fixtureModuleBody = `
import { apiFixture, DEMO_ACCOUNTS } from '/src/fixtures/apiFixture.js';
export const isFixtureMode = true;
export const onSessionExpired = () => () => {};
export const apiService = {
  ...apiFixture,
  demoAccounts: DEMO_ACCOUNTS
};
`;

// 2. Parse & validate port and strictPort arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let rawPort = process.env.PORT || '5173';
  let strictPort = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      rawPort = args[++i];
    } else if (arg.startsWith('--port=')) {
      rawPort = arg.split('=')[1];
    } else if (arg === '--strictPort' || arg === '--strict-port') {
      strictPort = true;
    }
  }

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`Error: Invalid port specified: "${rawPort}". Port must be an integer between 1 and 65535.`);
    process.exit(1);
  }

  return { port, strictPort };
}

const { port, strictPort } = parseArgs();

async function start() {
  let server;
  try {
    server = await createServer({
      root: clientRoot,
      configFile: path.resolve(clientRoot, 'vite.config.js'),
      plugins: [
        {
          name: 'synthetic-fixture-mode-plugin',
          configureServer(s) {
            s.middlewares.use((req, res, next) => {
              if (req.url) {
                // Exact module path match: /src/services/apiService.js (ignoring Vite query parameters)
                const parsed = new URL(req.url, 'http://127.0.0.1');
                if (parsed.pathname === '/src/services/apiService.js') {
                  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                  return res.end(fixtureModuleBody);
                }
              }
              next();
            });
          }
        }
      ],
      server: {
        port,
        strictPort,
        host: '127.0.0.1' // Strictly bind to loopback address
      }
    });

    await server.listen();
  } catch (err) {
    if (strictPort && (err.code === 'EADDRINUSE' || String(err).includes('already in use'))) {
      console.error(`Error: Port ${port} is already in use and --strictPort was specified.`);
    } else {
      console.error('Failed to start synthetic preview server:', err.message || err);
    }
    process.exit(1);
  }

  const address = server.httpServer.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;
  const actualUrl = `http://127.0.0.1:${actualPort}`;

  console.log('\n============================================================');
  console.log('🚀 NextStep Dedicated Synthetic Preview Server');
  console.log(`Listening URL:  ${actualUrl}`);
  console.log(`Bound Host:     127.0.0.1 (Loopback only)`);
  if (actualPort !== port) {
    console.log(`Requested Port: ${port} (Occupied -> auto-assigned next open port ${actualPort})`);
  } else {
    console.log(`Port:           ${actualPort}`);
  }
  console.log('Mode:           SYNTHETIC FIXTURE MODE (isFixtureMode = true)');
  console.log('Demo Accounts:');
  console.log('  - student.active@nextstep.local     / password123 (Recommended)');
  console.log('  - student.interrupted@nextstep.local / password123');
  console.log('  - student.ready@nextstep.local       / password123');
  console.log('Note: Normal dev/production uses live Supabase authentication.');
  console.log('      This dedicated preview serves offline fixture data safely.');
  console.log('Press Ctrl+C to terminate.');
  console.log('============================================================\n');

  return { server, actualUrl, actualPort };
}

start().catch((err) => {
  console.error('Fatal preview startup error:', err);
  process.exit(1);
});
