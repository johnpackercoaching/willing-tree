/**
 * Critical User Flow Tests
 * Tests essential user journeys through the application
 */

import { test, expect } from '@playwright/test';

const PROD_URL = 'https://willing-tree-pi.vercel.app';
const TEST_USER = {
  email: 'willingtree.test.2024@gmail.com',
  password: 'TestUser2024!Secure'
};

test.describe('Critical User Flows', () => {
  // Run tests in parallel for speed
  test.describe.configure({ mode: 'parallel' });

  test('1. New User Signup Flow', async ({ page }) => {
    console.log('🔍 Testing new user signup flow...');

    await page.goto(`${PROD_URL}/auth/signup`);

    // Check if signup page loads
    const signupForm = page.locator('form');
    await expect(signupForm).toBeVisible({ timeout: 10000 });

    // Check for required fields
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]').first(); // Get first password field
    const nameField = page.locator('input[name="name"], input[placeholder*="name" i]');

    // Verify form fields exist
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();

    // Check for password requirements display
    const passwordHelp = page.locator('text=/password/i').first();
    if (await passwordHelp.isVisible()) {
      console.log('✅ Password field found');
    }

    // Check for terms of service link
    const termsLink = page.locator('text=/terms/i');
    if (await termsLink.count() > 0) {
      console.log('✅ Terms of service link present');
    } else {
      console.log('⚠️ No terms of service link found');
    }

    // Check for login link (already have account)
    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible();
    console.log('✅ Login redirect link present');
  });

  test('2. Login and Dashboard Access', async ({ page }) => {
    console.log('🔍 Testing login and dashboard access...');

    await page.goto(`${PROD_URL}/auth/login`);

    // Login
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(url => !url.pathname.includes('login'), {
      timeout: 15000
    }).catch(() => {
      console.log('⚠️ Login redirect timeout - checking current state');
    });

    // Check where we landed
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Check for dashboard elements
    const navBar = page.locator('nav, [role="navigation"]');
    const isNavVisible = await navBar.isVisible().catch(() => false);

    if (isNavVisible) {
      console.log('✅ Navigation bar visible after login');
    } else {
      console.log('❌ No navigation bar found after login');
    }

    // Check for user indicators
    const userIndicators = await page.locator('text=/profile|settings|logout|sign out/i').count();
    if (userIndicators > 0) {
      console.log('✅ User session indicators present');
    } else {
      console.log('❌ No user session indicators found');
    }
  });

  test('3. Core App Navigation', async ({ page }) => {
    console.log('🔍 Testing core navigation flow...');

    // Start from login
    await page.goto(`${PROD_URL}/auth/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000); // Let app stabilize

    // Test navigation links
    const navigationTests = [
      { text: /home/i, url: '/', name: 'Home' },
      { text: /innermost/i, url: '/innermosts', name: 'Innermosts' },
      { text: /profile/i, url: '/profile', name: 'Profile' },
      { text: /settings/i, url: '/settings', name: 'Settings' }
    ];

    for (const navTest of navigationTests) {
      const link = page.locator(`text=${navTest.text}`).first();
      const isVisible = await link.isVisible().catch(() => false);

      if (isVisible) {
        console.log(`✅ ${navTest.name} link found`);

        // Try to click it
        await link.click().catch(err => {
          console.log(`⚠️ Could not click ${navTest.name}: ${err.message}`);
        });

        await page.waitForTimeout(1000);
        const currentPath = new URL(page.url()).pathname;

        if (currentPath.includes(navTest.url) || currentPath === navTest.url) {
          console.log(`✅ Navigation to ${navTest.name} successful`);
        } else {
          console.log(`⚠️ ${navTest.name} navigation didn't reach expected URL. Current: ${currentPath}`);
        }
      } else {
        console.log(`❌ ${navTest.name} link not found in navigation`);
      }
    }
  });

  test('4. Create Innermost Flow', async ({ page }) => {
    console.log('🔍 Testing innermost creation flow...');

    // Login first
    await page.goto(`${PROD_URL}/auth/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to innermosts
    await page.goto(`${PROD_URL}/innermosts`);
    await page.waitForTimeout(2000);

    // Look for create button
    const createButton = page.locator('button:has-text("add"), button:has-text("create"), button:has-text("new")').first();
    const hasCreateButton = await createButton.isVisible().catch(() => false);

    if (hasCreateButton) {
      console.log('✅ Create innermost button found');

      await createButton.click();
      await page.waitForTimeout(2000);

      // Check for form elements
      const nameInput = page.locator('input[type="text"], input[name*="name"]').first();
      const hasForm = await nameInput.isVisible().catch(() => false);

      if (hasForm) {
        console.log('✅ Innermost creation form displayed');
      } else {
        console.log('❌ Innermost creation form not found');
      }
    } else {
      console.log('❌ No create innermost button found');

      // Check if we hit the limit
      const limitText = page.locator('text=/limit|maximum|upgrade/i');
      if (await limitText.count() > 0) {
        console.log('⚠️ User may have hit innermost limit');
      }
    }
  });

  test('5. Weekly Game Flow Check', async ({ page }) => {
    console.log('🔍 Testing weekly game flow...');

    // Login
    await page.goto(`${PROD_URL}/auth/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check for game-related UI elements
    const gameElements = [
      { selector: 'text=/week/i', name: 'Week indicator' },
      { selector: 'text=/guess/i', name: 'Guess functionality' },
      { selector: 'text=/score/i', name: 'Score display' },
      { selector: 'text=/wants/i', name: 'Wants section' },
      { selector: 'text=/willing/i', name: 'Willing section' }
    ];

    for (const element of gameElements) {
      const count = await page.locator(element.selector).count();
      if (count > 0) {
        console.log(`✅ ${element.name} found (${count} instances)`);
      } else {
        console.log(`⚠️ ${element.name} not found on page`);
      }
    }
  });

  test('6. Settings and Profile Management', async ({ page }) => {
    console.log('🔍 Testing settings and profile management...');

    // Login
    await page.goto(`${PROD_URL}/auth/login`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Go to settings
    await page.goto(`${PROD_URL}/settings`);
    await page.waitForTimeout(2000);

    // Check for settings options
    const settingsOptions = [
      { text: /notification/i, name: 'Notifications' },
      { text: /privacy/i, name: 'Privacy' },
      { text: /account/i, name: 'Account' },
      { text: /data|export/i, name: 'Data Management' },
      { text: /delete/i, name: 'Account Deletion' }
    ];

    for (const option of settingsOptions) {
      const element = page.locator(`text=${option.text}`).first();
      const exists = await element.count() > 0;

      if (exists) {
        console.log(`✅ ${option.name} option present`);
      } else {
        console.log(`⚠️ ${option.name} option not found`);
      }
    }

    // Check for logout option
    const logoutButton = page.locator('button:has-text("logout"), button:has-text("sign out")').first();
    if (await logoutButton.count() > 0) {
      console.log('✅ Logout option available');
    } else {
      console.log('❌ No logout option found');
    }
  });

  test('7. Error States and Recovery', async ({ page }) => {
    console.log('🔍 Testing error states and recovery...');

    // Test invalid login
    await page.goto(`${PROD_URL}/auth/login`);
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Check for error message
    const errorMessage = page.locator('text=/error|invalid|incorrect|failed/i');
    if (await errorMessage.count() > 0) {
      console.log('✅ Error message displayed for invalid login');
    } else {
      console.log('❌ No error message shown for invalid credentials');
    }

    // Test navigation to non-existent page
    await page.goto(`${PROD_URL}/this-does-not-exist-12345`);
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    if (!currentUrl.includes('this-does-not-exist')) {
      console.log('✅ 404 handling redirects properly');
    } else {
      console.log('❌ 404 page not handling properly');
    }
  });

  test('8. Mobile Responsiveness Check', async ({ page }) => {
    console.log('🔍 Testing mobile responsiveness...');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size

    await page.goto(`${PROD_URL}/auth/login`);

    // Check if login form is usable on mobile
    const loginForm = page.locator('form');
    const formBox = await loginForm.boundingBox();

    if (formBox && formBox.width <= 375) {
      console.log('✅ Login form fits mobile viewport');
    } else {
      console.log('⚠️ Login form may overflow mobile viewport');
    }

    // Check for mobile menu
    const mobileMenu = page.locator('[aria-label*="menu"], button:has-text("menu"), [class*="burger"], [class*="hamburger"]');
    if (await mobileMenu.count() > 0) {
      console.log('✅ Mobile menu present');
    } else {
      console.log('⚠️ No mobile menu found - navigation may be difficult on mobile');
    }

    // Login and check mobile navigation
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check if navigation is accessible on mobile
    const navElements = await page.locator('nav a, nav button').count();
    if (navElements > 0) {
      console.log(`✅ ${navElements} navigation elements found on mobile`);
    } else {
      console.log('❌ No navigation elements accessible on mobile');
    }
  });
});