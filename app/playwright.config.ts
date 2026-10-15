import { defineConfig } from '@playwright/test';

// End-to-end tests treat the app as a black box: it runs in its own
// container (docker compose "app" service) and we only talk HTTP to it.
export default defineConfig({
  testDir: './e2e',
  // HTML report in playwright-report/ — view it with `npx playwright show-report`.
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
  },
});
