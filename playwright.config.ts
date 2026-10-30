import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const base = process.env.VITE_BASE && process.env.VITE_BASE !== './' ? process.env.VITE_BASE : '/';

// Claude cloud sessions ship a preinstalled Chromium that may not match this Playwright version
const localChromium = '/opt/pw-browsers/chromium';
const launchOptions =
  !process.env.CI && existsSync(localChromium) ? { executablePath: localChromium } : {};

export default defineConfig({
  testDir: 'e2e',
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: { baseURL: `http://localhost:4173${base}`, trace: 'retain-on-failure', launchOptions },
  webServer: {
    command: 'node e2e/serve.mjs',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
