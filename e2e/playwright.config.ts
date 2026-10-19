import { defineConfig, devices } from '@playwright/test';

/**
 * CivicPulse AI — 3-Portal End-to-End Playwright Configuration
 * Covers:
 * 1. Citizen PWA (http://localhost:3000)
 * 2. Field Inspector App (http://localhost:3001)
 * 3. Command Center Web Admin (http://localhost:3002)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'citizen-pwa',
      testMatch: /01_citizen_portal\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:3000',
        permissions: ['geolocation', 'camera'],
        geolocation: { latitude: 22.7196, longitude: 75.8577 }, // Rajwada, Indore
      },
    },
    {
      name: 'field-inspector',
      testMatch: /02_inspector_portal\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:3001',
        permissions: ['geolocation', 'camera'],
        geolocation: { latitude: 22.7196, longitude: 75.8577 },
      },
    },
    {
      name: 'command-center-desktop',
      testMatch: /03_admin_portal\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'cross-portal-golden-flow',
      testMatch: /04_cross_portal_golden_flow\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
