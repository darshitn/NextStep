import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`[NextStep API] Server listening on http://0.0.0.0:${config.PORT} (env: ${config.NODE_ENV})`);
});

export default server;
