import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

// Test user credentials
const TEST_USER = {
  email: 'willingtree.test.2024@gmail.com',
  password: 'TestUser2024!Secure'
};

setup('authenticate', async ({ page }) => {
  console.log('🔐 Setting up authentication for all tests...');

  // ADD CONSOLE LOGGING - THIS IS THE WHOLE POINT!
  page.on('console', (msg) => {
    const colors = {
      'error': '\x1b[31m',
      'warning': '\x1b[33m',
      'info': '\x1b[36m',
      'log': '\x1b[37m',
      'debug': '\x1b[90m'
    };
    const color = colors[msg.type()] || '\x1b[37m';
    console.log(`${color}[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}\x1b[0m`);

    // Highlight Firebase errors
    if (msg.text().includes('Firebase') && msg.text().includes('Error')) {
      console.log('\x1b[91m  🔥 FIREBASE ERROR DETECTED!\x1b[0m');
    }
  });

  page.on('pageerror', (error) => {
    console.error('\x1b[31m[PAGE ERROR]\x1b[0m', error.message);
  });

  page.on('requestfailed', (request) => {
    console.error('\x1b[31m[NETWORK FAILED]\x1b[0m', request.url());
    console.error('\x1b[31m  Error:', request.failure()?.errorText, '\x1b[0m');
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      console.log(`\x1b[33m[HTTP ${response.status()}] ${response.url()}\x1b[0m`);
    }
  });

  // Navigate to login page
  await page.goto('https://willing-tree-pi.vercel.app/auth/login');

  // Wait for page to fully load
  await page.waitForLoadState('networkidle');

  // Fill in login form
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation away from login page
  // The app should redirect after successful login
  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 30000
    });
  } catch (error) {
    // If we're still on login page, authentication failed
    console.error('Authentication failed - check if credentials are correct');
    throw error;
  }

  // Give Firebase time to set up auth state
  await page.waitForTimeout(2000);

  console.log('✅ Authentication successful!');

  // Save storage state WITH IndexedDB (critical for Firebase!)
  await page.context().storageState({
    path: authFile,
    indexedDB: true  // This is REQUIRED for Firebase auth to work!
  });

  console.log('💾 Auth state saved to:', authFile);
});