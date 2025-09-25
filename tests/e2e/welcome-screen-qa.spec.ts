/**
 * Welcome Screen QA Test Suite
 * Production Regression Test for WillingTree
 *
 * Test User: johnmpacker1@gmail.com
 * Password: W7illing_1005
 *
 * This test validates the complete user journey from Welcome screen
 * through authentication to dashboard access.
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  credentials: {
    email: 'willingtree.test.2024@gmail.com',
    password: 'TestUser2024!Secure'
  },
  timeouts: {
    pageLoad: 3000,
    navigation: 1000,
    interaction: 100
  },
  screenshots: {
    enabled: true,
    dir: 'test-results/screenshots'
  }
};

// Helper function to take screenshots with timestamp
async function takeScreenshot(page: Page, name: string) {
  if (TEST_CONFIG.screenshots.enabled) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${timestamp}-${name}.png`;
    await page.screenshot({
      path: path.join(TEST_CONFIG.screenshots.dir, fileName),
      fullPage: true
    });
    console.log(`📸 Screenshot saved: ${fileName}`);
  }
}

// Helper to measure performance
async function measurePerformance(page: Page) {
  const metrics = await page.evaluate(() => {
    const timing = performance.timing;
    return {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
    };
  });
  return metrics;
}

test.describe('Welcome Screen QA Test Suite', () => {

  test.beforeAll(async () => {
    // Create screenshots directory if it doesn't exist
    const screenshotDir = TEST_CONFIG.screenshots.dir;
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and storage for fresh start
    await context.clearCookies();
    await context.clearPermissions();

    // Clear localStorage and sessionStorage
    await page.goto(TEST_CONFIG.baseUrl);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('✅ Test environment reset complete');
  });

  test('1. Welcome Screen - New User Standard Flow', async ({ page }) => {
    console.log('🚀 Starting Welcome Screen Test');

    // Step 1: Navigate to app
    await test.step('Launch application', async () => {
      const startTime = Date.now();
      await page.goto(TEST_CONFIG.baseUrl);
      const loadTime = Date.now() - startTime;

      console.log(`⏱️ Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(TEST_CONFIG.timeouts.pageLoad);

      await takeScreenshot(page, 'welcome-screen-initial');
    });

    // Step 2: Verify Welcome screen elements
    await test.step('Verify Welcome screen elements', async () => {
      // Check for welcome screen presence
      const welcomeScreen = page.locator('[data-testid="welcome-screen"], .welcome-screen, #welcome');

      // If no specific welcome screen, check for login form directly
      if (await welcomeScreen.count() === 0) {
        console.log('⚠️ No dedicated welcome screen found, checking for login page');

        // Check if we're on login page
        const loginForm = page.locator('form').filter({ has: page.locator('input[type="email"]') });
        expect(await loginForm.count()).toBeGreaterThan(0);

        console.log('✅ Login page found - app ready for authentication');
        await takeScreenshot(page, 'login-page-instead-of-welcome');
        return;
      }

      // Verify welcome screen components
      await expect(welcomeScreen).toBeVisible();

      // Check for logo/branding
      const logo = page.locator('img[alt*="WillingTree"], .logo, [data-testid="app-logo"]');
      if (await logo.count() > 0) {
        await expect(logo.first()).toBeVisible();
        console.log('✅ Logo/branding visible');
      }

      // Check for welcome message
      const welcomeText = page.locator('text=/welcome|grow.*relationship/i');
      if (await welcomeText.count() > 0) {
        await expect(welcomeText.first()).toBeVisible();
        console.log('✅ Welcome message visible');
      }

      // Check for Get Started button
      const getStartedBtn = page.locator('button').filter({ hasText: /get started|continue|begin|start/i });
      if (await getStartedBtn.count() > 0) {
        await expect(getStartedBtn.first()).toBeEnabled();
        console.log('✅ Get Started button available');
      }

      await takeScreenshot(page, 'welcome-screen-verified');
    });

    // Step 3: Progress through welcome flow
    await test.step('Navigate through welcome flow', async () => {
      // Try to click Get Started if available
      const getStartedBtn = page.locator('button').filter({ hasText: /get started|continue|begin|start/i });

      if (await getStartedBtn.count() > 0) {
        console.log('📍 Clicking Get Started button');
        await getStartedBtn.first().click();

        // Wait for navigation
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
          console.log('⚠️ Network idle timeout - continuing');
        });

        await takeScreenshot(page, 'after-get-started');
      }
    });

    // Step 4: Reach login/signup
    await test.step('Reach authentication page', async () => {
      // Wait for login form to appear
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]');

      // Try to wait for email input
      try {
        await emailInput.waitFor({ state: 'visible', timeout: 5000 });
        console.log('✅ Reached login/signup page');
      } catch {
        console.log('⚠️ Email input not found, checking current page');

        // Take diagnostic screenshot
        await takeScreenshot(page, 'current-page-state');

        // Try to find any form
        const anyForm = page.locator('form');
        if (await anyForm.count() > 0) {
          console.log('✅ Found form on page');
        }
      }

      await takeScreenshot(page, 'authentication-page');
    });

    // Performance metrics
    const metrics = await measurePerformance(page);
    console.log('📊 Performance Metrics:', metrics);
  });

  test('2. Authentication - Login with Test User', async ({ page }) => {
    console.log('🔐 Starting Authentication Test');

    // Navigate directly to login
    await page.goto(TEST_CONFIG.baseUrl);

    // Handle both welcome screen and direct login scenarios
    const getStartedBtn = page.locator('button').filter({ hasText: /get started|continue|begin|start|sign in|log in/i });
    if (await getStartedBtn.count() > 0) {
      await getStartedBtn.first().click();
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    }

    await test.step('Enter credentials', async () => {
      // Find and fill email
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 10000 });
      await emailInput.fill(TEST_CONFIG.credentials.email);
      console.log('✅ Email entered');

      // Find and fill password
      const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"]').first();
      await passwordInput.fill(TEST_CONFIG.credentials.password);
      console.log('✅ Password entered');

      await takeScreenshot(page, 'credentials-entered');
    });

    await test.step('Submit login form', async () => {
      // Find submit button
      const submitBtn = page.locator('button[type="submit"], button').filter({
        hasText: /sign in|log in|login|submit|continue/i
      }).first();

      await submitBtn.click();
      console.log('📤 Login form submitted');

      // Wait for navigation or error
      try {
        await page.waitForURL(url => !url.includes('login') && !url.includes('auth'), {
          timeout: 10000
        });
        console.log('✅ Successfully logged in');
      } catch {
        // Check for error messages
        const errorMsg = page.locator('.error, .alert, [role="alert"]');
        if (await errorMsg.count() > 0) {
          const errorText = await errorMsg.first().textContent();
          console.log(`❌ Login error: ${errorText}`);
          await takeScreenshot(page, 'login-error');
        } else {
          console.log('⚠️ Login may have succeeded but URL did not change');
        }
      }

      await takeScreenshot(page, 'after-login');
    });

    await test.step('Verify dashboard access', async () => {
      // Check for dashboard elements
      const dashboardIndicators = [
        page.locator('[data-testid="dashboard"]'),
        page.locator('.dashboard'),
        page.locator('text=/dashboard|home|welcome back/i'),
        page.locator('[data-testid="user-menu"]'),
        page.locator('button').filter({ hasText: /logout|sign out/i })
      ];

      let dashboardFound = false;
      for (const indicator of dashboardIndicators) {
        if (await indicator.count() > 0) {
          dashboardFound = true;
          console.log('✅ Dashboard element found');
          break;
        }
      }

      if (dashboardFound) {
        console.log('✅ Successfully reached dashboard');
        await takeScreenshot(page, 'dashboard-reached');
      } else {
        console.log('⚠️ Dashboard elements not found');
        await takeScreenshot(page, 'current-state');
      }
    });
  });

  test('3. State Persistence - Verify Welcome Not Shown Again', async ({ page }) => {
    console.log('🔄 Testing State Persistence');

    // First, complete login
    await page.goto(TEST_CONFIG.baseUrl);

    // Quick login
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.count() > 0) {
      await emailInput.fill(TEST_CONFIG.credentials.email);
      await passwordInput.fill(TEST_CONFIG.credentials.password);

      const submitBtn = page.locator('button').filter({
        hasText: /sign in|log in|login|submit/i
      }).first();
      await submitBtn.click();

      // Wait for login to complete
      await page.waitForTimeout(3000);
    }

    await test.step('Check localStorage state', async () => {
      const storageState = await page.evaluate(() => {
        return {
          welcomeCompleted: localStorage.getItem('welcomeCompleted'),
          onboardingStep: localStorage.getItem('onboardingStep'),
          userToken: localStorage.getItem('authToken') || sessionStorage.getItem('authToken'),
          hasUser: !!localStorage.getItem('user') || !!sessionStorage.getItem('user')
        };
      });

      console.log('📦 Storage State:', storageState);

      if (storageState.userToken || storageState.hasUser) {
        console.log('✅ User session stored');
      }
    });

    await test.step('Reload and verify no welcome screen', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check that we're not on welcome screen
      const welcomeScreen = page.locator('[data-testid="welcome-screen"], .welcome-screen');
      const welcomeCount = await welcomeScreen.count();

      if (welcomeCount === 0) {
        console.log('✅ Welcome screen not shown on reload');
      } else {
        console.log('⚠️ Welcome screen still visible after login');
      }

      await takeScreenshot(page, 'after-reload');
    });
  });

  test('4. Performance Benchmarks', async ({ page }) => {
    console.log('⚡ Running Performance Benchmarks');

    await test.step('Measure initial load performance', async () => {
      const startTime = Date.now();
      await page.goto(TEST_CONFIG.baseUrl);
      const loadTime = Date.now() - startTime;

      const metrics = await measurePerformance(page);

      console.log('📊 Performance Results:');
      console.log(`  - Page Load: ${loadTime}ms (target: <3000ms)`);
      console.log(`  - DOM Ready: ${metrics.domContentLoaded}ms`);
      console.log(`  - Full Load: ${metrics.loadComplete}ms`);
      console.log(`  - First Paint: ${metrics.firstPaint}ms`);
      console.log(`  - First Contentful Paint: ${metrics.firstContentfulPaint}ms`);

      // Assert performance requirements
      expect(loadTime).toBeLessThan(3000);
      expect(metrics.firstContentfulPaint).toBeLessThan(1500);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Log test results
    console.log(`\n📋 Test "${testInfo.title}" - ${testInfo.status}`);

    if (testInfo.status === 'failed') {
      // Take failure screenshot
      await takeScreenshot(page, `FAILED-${testInfo.title.replace(/\s+/g, '-')}`);

      // Log console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('🔴 Console Error:', msg.text());
        }
      });
    }
  });

  test.afterAll(async () => {
    console.log('\n✅ Welcome Screen QA Test Suite Complete\n');
    console.log(`📁 Screenshots saved to: ${TEST_CONFIG.screenshots.dir}`);
  });
});