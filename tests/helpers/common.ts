import { Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

/**
 * Common test utilities and helpers
 */

// Test user credentials
export const TEST_USERS = {
  default: {
    email: 'test@willingtree.app',
    password: 'Test123456!',
    displayName: 'Test User'
  },
  admin: {
    email: 'admin@willingtree.app',
    password: 'Admin123456!',
    displayName: 'Admin User'
  },
  partner: {
    email: 'partner@willingtree.app',
    password: 'Partner123456!',
    displayName: 'Partner User'
  }
} as const;

// Test data generators
export const TEST_DATA = {
  generateEmail: (prefix: string = 'test'): string => {
    const timestamp = Date.now();
    return `${prefix}_${timestamp}@willingtree.app`;
  },

  generateWantTitle: (): string => {
    const titles = [
      'Learn to cook pasta',
      'Visit the mountains',
      'Start meditation practice',
      'Read more books',
      'Exercise regularly'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  },

  generateWantDescription: (): string => {
    return `This is a test want created at ${new Date().toISOString()}`;
  },

  generateInnermostName: (): string => {
    const names = ['Family Tree', 'Friendship Garden', 'Love Blossom', 'Connection Grove'];
    return names[Math.floor(Math.random() * names.length)];
  }
};

/**
 * Authentication helper - performs login and returns to original page
 */
export async function authenticateUser(
  page: Page,
  user: typeof TEST_USERS.default = TEST_USERS.default
): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.email, user.password);
  await loginPage.waitForLoginResult();
}

/**
 * Wait for element with custom timeout and retry logic
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  options?: {
    timeout?: number;
    retries?: number;
    state?: 'visible' | 'hidden' | 'attached' | 'detached';
  }
): Promise<void> {
  const { timeout = 10000, retries = 3, state = 'visible' } = options || {};

  for (let i = 0; i < retries; i++) {
    try {
      await page.locator(selector).waitFor({ state, timeout });
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      await page.waitForTimeout(1000); // Wait before retry
    }
  }
}

/**
 * Navigate with retry logic for flaky navigation
 */
export async function navigateWithRetry(
  page: Page,
  url: string,
  options?: {
    timeout?: number;
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  }
): Promise<void> {
  const { timeout = 30000, waitUntil = 'domcontentloaded' } = options || {};

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { timeout, waitUntil });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(2000);
    }
  }
}

/**
 * Clear all test data (for cleanup)
 */
export async function clearTestData(page: Page): Promise<void> {
  // This would typically call an API endpoint or database cleanup
  // For now, it's a placeholder
  console.log('Clearing test data...');
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshots/${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  return filename;
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(
  page: Page,
  options?: {
    timeout?: number;
    maxInflightRequests?: number;
  }
): Promise<void> {
  const { timeout = 10000, maxInflightRequests = 0 } = options || {};
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Check if element has expected text
 */
export async function verifyElementText(
  page: Page,
  selector: string,
  expectedText: string | RegExp,
  options?: { timeout?: number }
): Promise<void> {
  const { timeout = 5000 } = options || {};
  const locator = page.locator(selector);

  if (typeof expectedText === 'string') {
    await expect(locator).toHaveText(expectedText, { timeout });
  } else {
    await expect(locator).toContainText(expectedText, { timeout });
  }
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string
): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Wait for animations to complete
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.getAnimations()).map(animation => animation.finished)
    );
  });
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string | RegExp,
  response: any
): Promise<void> {
  await page.route(url, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Get localStorage item
 */
export async function getLocalStorageItem(
  page: Page,
  key: string
): Promise<any> {
  return await page.evaluate((key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }, key);
}

/**
 * Set localStorage item
 */
export async function setLocalStorageItem(
  page: Page,
  key: string,
  value: any
): Promise<void> {
  await page.evaluate(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key, value });
}

/**
 * Clear all cookies and localStorage
 */
export async function clearBrowserData(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for auth token or user data in localStorage
  const authToken = await getLocalStorageItem(page, 'auth-token');
  return authToken !== null;
}

/**
 * Wait for toast message and return its text
 */
export async function getToastMessage(page: Page): Promise<string | null> {
  const toast = page.locator('.toast').or(page.locator('[role="alert"]'));

  try {
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    return await toast.textContent();
  } catch {
    return null;
  }
}

/**
 * Dismiss all toasts
 */
export async function dismissToasts(page: Page): Promise<void> {
  const toasts = page.locator('.toast-close').or(page.locator('[aria-label="Close"]'));
  const count = await toasts.count();

  for (let i = 0; i < count; i++) {
    await toasts.nth(i).click();
  }
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Retry an async function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
}