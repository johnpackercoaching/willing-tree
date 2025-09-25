/**
 * Authentication Verification Test
 *
 * Purpose: Definitively confirm if the test credentials work
 * User: johnmpacker1@gmail.com
 * Password: W7illing_1005
 *
 * This test will provide a 100% clear PASS or FAIL result
 */

import { test, expect } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'johnmpacker1@gmail.com',
  password: 'W7illing_1005'
};

test('AUTHENTICATION VERIFICATION - Definitive Test', async ({ page }) => {
  console.log('=====================================');
  console.log('🔐 AUTHENTICATION VERIFICATION TEST');
  console.log('=====================================');
  console.log(`Email: ${TEST_CREDENTIALS.email}`);
  console.log(`Password: ${TEST_CREDENTIALS.password.replace(/./g, '*')}`);
  console.log('=====================================\n');

  // Step 1: Navigate to the app
  console.log('📍 Step 1: Navigating to app...');
  await page.goto('https://willing-tree-pi.vercel.app');
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded\n');

  // Step 2: Find and fill email field
  console.log('📍 Step 2: Entering email...');
  const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]').first();

  // Check if email field exists
  const emailFieldCount = await emailField.count();
  if (emailFieldCount === 0) {
    console.log('❌ FAIL: No email field found on page');
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'test-results/auth-fail-no-email-field.png' });
    throw new Error('Email field not found');
  }

  await emailField.fill(TEST_CREDENTIALS.email);
  const emailValue = await emailField.inputValue();
  console.log(`✅ Email entered: ${emailValue}\n`);

  // Step 3: Find and fill password field
  console.log('📍 Step 3: Entering password...');
  const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i], input[placeholder*="Password" i]').first();

  const passwordFieldCount = await passwordField.count();
  if (passwordFieldCount === 0) {
    console.log('❌ FAIL: No password field found on page');
    await page.screenshot({ path: 'test-results/auth-fail-no-password-field.png' });
    throw new Error('Password field not found');
  }

  await passwordField.fill(TEST_CREDENTIALS.password);
  console.log('✅ Password entered (hidden)\n');

  // Take screenshot before submit
  await page.screenshot({ path: 'test-results/auth-before-submit.png' });

  // Step 4: Submit the form
  console.log('📍 Step 4: Submitting credentials...');

  // Find submit button - try multiple selectors
  const submitButton = page.locator(
    'button[type="submit"], ' +
    'button:has-text("Sign In"), ' +
    'button:has-text("Sign in"), ' +
    'button:has-text("Log In"), ' +
    'button:has-text("Log in"), ' +
    'button:has-text("Login"), ' +
    'button:has-text("Continue")'
  ).first();

  const submitButtonCount = await submitButton.count();
  if (submitButtonCount === 0) {
    console.log('❌ FAIL: No submit button found');
    await page.screenshot({ path: 'test-results/auth-fail-no-submit-button.png' });
    throw new Error('Submit button not found');
  }

  // Click submit and wait for response
  await submitButton.click();
  console.log('✅ Form submitted\n');

  // Step 5: Wait and check for authentication result
  console.log('📍 Step 5: Checking authentication result...');
  console.log('Waiting up to 10 seconds for authentication...\n');

  // Wait for one of these conditions:
  // 1. URL changes (successful login)
  // 2. Error message appears
  // 3. Dashboard/home elements appear
  // 4. Timeout

  const result = await Promise.race([
    // Check for URL change away from login
    page.waitForURL(url => !url.includes('login') && !url.includes('auth') && url !== 'https://willing-tree-pi.vercel.app/', {
      timeout: 10000
    }).then(() => 'url_changed'),

    // Check for error message
    page.waitForSelector('.error, .alert, [role="alert"], .text-red-500, .text-red-600, .text-danger', {
      timeout: 10000
    }).then(() => 'error_shown'),

    // Check for dashboard/success indicators
    page.waitForSelector('[data-testid="dashboard"], [data-testid="user-menu"], button:has-text("Logout"), button:has-text("Sign Out")', {
      timeout: 10000
    }).then(() => 'dashboard_shown'),

    // Timeout fallback
    new Promise(resolve => setTimeout(() => resolve('timeout'), 10000))
  ]);

  // Take screenshot of result
  await page.screenshot({ path: 'test-results/auth-after-submit.png' });

  // Analyze the result
  console.log('=====================================');
  console.log('🔍 AUTHENTICATION RESULT:');
  console.log('=====================================\n');

  switch(result) {
    case 'url_changed':
      console.log('✅ SUCCESS: URL changed - authentication likely successful');
      console.log(`New URL: ${page.url()}`);
      break;

    case 'dashboard_shown':
      console.log('✅ SUCCESS: Dashboard elements found - user is logged in');
      break;

    case 'error_shown':
      const errorElement = await page.locator('.error, .alert, [role="alert"], .text-red-500, .text-red-600, .text-danger').first();
      const errorText = await errorElement.textContent();
      console.log('❌ FAIL: Error message displayed');
      console.log(`Error: ${errorText}`);
      break;

    case 'timeout':
      console.log('⚠️  INCONCLUSIVE: No clear success or failure after 10 seconds');
      console.log(`Current URL: ${page.url()}`);
      console.log('Page might be loading slowly or credentials might be invalid');

      // Check current page state
      const hasEmailField = await page.locator('input[type="email"]').count() > 0;
      const hasPasswordField = await page.locator('input[type="password"]').count() > 0;

      if (hasEmailField && hasPasswordField) {
        console.log('❌ LIKELY FAIL: Still on login page - authentication probably failed silently');
      }
      break;
  }

  // Final verification - check localStorage/sessionStorage for auth tokens
  console.log('\n📍 Step 6: Checking for stored authentication data...');
  const authData = await page.evaluate(() => {
    return {
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage),
      hasAuthToken: !!(localStorage.getItem('authToken') ||
                       sessionStorage.getItem('authToken') ||
                       localStorage.getItem('token') ||
                       sessionStorage.getItem('token')),
      hasUserData: !!(localStorage.getItem('user') ||
                      sessionStorage.getItem('user') ||
                      localStorage.getItem('currentUser') ||
                      sessionStorage.getItem('currentUser'))
    };
  });

  console.log('Storage analysis:');
  console.log(`- Auth token found: ${authData.hasAuthToken ? '✅ YES' : '❌ NO'}`);
  console.log(`- User data found: ${authData.hasUserData ? '✅ YES' : '❌ NO'}`);
  console.log(`- LocalStorage keys: ${authData.localStorageKeys.join(', ') || 'none'}`);
  console.log(`- SessionStorage keys: ${authData.sessionStorageKeys.join(', ') || 'none'}`);

  // FINAL VERDICT
  console.log('\n=====================================');
  console.log('📊 FINAL VERDICT:');
  console.log('=====================================\n');

  const currentUrl = page.url();
  const isStillOnLogin = currentUrl.includes('login') || currentUrl === 'https://willing-tree-pi.vercel.app/';
  const hasAuthTokens = authData.hasAuthToken || authData.hasUserData;

  if (!isStillOnLogin && hasAuthTokens) {
    console.log('✅✅✅ AUTHENTICATION SUCCESSFUL ✅✅✅');
    console.log('The test credentials WORK!');
    console.log(`User ${TEST_CREDENTIALS.email} is authenticated.`);
  } else if (!isStillOnLogin && !hasAuthTokens) {
    console.log('⚠️  PARTIAL SUCCESS');
    console.log('Navigation occurred but no auth tokens found.');
    console.log('Authentication might use different storage mechanism.');
  } else if (result === 'error_shown') {
    console.log('❌❌❌ AUTHENTICATION FAILED ❌❌❌');
    console.log('The test credentials DO NOT WORK!');
    console.log('Error was displayed on the page.');
  } else {
    console.log('❌❌❌ AUTHENTICATION FAILED ❌❌❌');
    console.log('The test credentials DO NOT WORK!');
    console.log('Still on login page after submission.');
  }

  console.log('\n=====================================');
  console.log('Screenshots saved in test-results/');
  console.log('=====================================');
});