import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

const fixtureModuleBody = `
import { apiFixture, DEMO_ACCOUNTS } from '/src/fixtures/apiFixture.js';
export const isFixtureMode = true;
export const onSessionExpired = () => () => {};
export const apiService = {
  ...apiFixture,
  demoAccounts: DEMO_ACCOUNTS
};
`;

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

async function start() {
  const server = await createServer({
    root: clientRoot,
    plugins: [
      {
        name: 'synthetic-fixture-mode-plugin',
        configureServer(s) {
          s.middlewares.use((req, res, next) => {
            if (req.url && req.url.includes('/src/services/apiService.js')) {
              res.setHeader('Content-Type', 'application/javascript');
              return res.end(fixtureModuleBody);
            }
            next();
          });
        }
      }
    ],
    server: {
      port,
      strictPort: false,
      host: true
    }
  });

  await server.listen();
  const address = server.httpServer.address();
  const actualPort = typeof address === 'object' && address ? address.port : port;

  console.log('\n============================================================');
  console.log('🚀 NextStep Dedicated Synthetic Preview Server');
  console.log(`Local URL:   http://localhost:${actualPort}`);
  console.log(`Network URL: http://127.0.0.1:${actualPort}`);
  console.log('Mode:        SYNTHETIC FIXTURE MODE (isFixtureMode = true)');
  console.log('Demo Accounts:');
  console.log('  - student.active@nextstep.local     / password123 (Recommended)');
  console.log('  - student.struggling@nextstep.local / password123');
  console.log('  - student.fresh@nextstep.local      / password123');
  console.log('Note: Unlike `npm run dev` (which connects to live Supabase auth),');
  console.log('      this command allows instant local testing without cloud credentials.');
  console.log('Press Ctrl+C to terminate.');
  console.log('============================================================\n');
}

start().catch((err) => {
  console.error('Failed to start synthetic preview:', err);
  process.exit(1);
});
