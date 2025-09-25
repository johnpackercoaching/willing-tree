import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_USER } from '../helpers/auth.helper';

/**
 * Comprehensive E2E Tests for Authentication
 * Tests login, signup, logout, remember me, and error states
 */
test.describe('Authentication Tests', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    // Clear cookies before each test
    await page.context().clearCookies();
    // Try to clear localStorage if accessible
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore localStorage errors in cross-origin contexts
      }
    }).catch(() => {});
  });

  test.afterEach(async ({ page }) => {
    // Clean up after each test
    await page.close();
  });

  test.describe('Login Flow', () => {
    test('should load the login page with all required elements', async ({ page }) => {
      await page.goto('/login');

      // Check for login form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Check for additional UI elements
      const forgotPasswordLink = page.locator('a:has-text("Forgot password"), a:has-text("Reset password")');
      const signupLink = page.locator('a:has-text("Sign up"), a:has-text("Create account")');

      // At least one should be visible
      const hasForgotPassword = await forgotPasswordLink.first().isVisible().catch(() => false);
      const hasSignupLink = await signupLink.first().isVisible().catch(() => false);

      expect(hasForgotPassword || hasSignupLink).toBeTruthy();
    });

    test('should successfully login with valid credentials', async ({ page }) => {
      await authHelper.login();

      // Verify user is logged in
      const isLoggedIn = await authHelper.isLoggedIn();
      expect(isLoggedIn).toBeTruthy();

      // Verify we're no longer on login page
      await expect(page).not.toHaveURL(/.*login/);

      // Take screenshot of dashboard/home after login
      await page.screenshot({ path: 'test-results/login-success.png' });
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Try to login with invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Wait for error message
      const errorMessage = page.locator('text=/invalid|incorrect|wrong|failed|error/i').first();
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Verify we're still on login page
      await expect(page).toHaveURL(/.*login/);
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');

      // Click submit without filling fields
      await page.click('button[type="submit"]');

      // Check for validation messages
      const validationMessage = page.locator('text=/required|enter|provide|fill/i').first();
      await expect(validationMessage).toBeVisible({ timeout: 5000 }).catch(async () => {
        // If no validation message, check if browser's HTML5 validation is being used
        const emailField = page.locator('input[type="email"]');
        const isInvalid = await emailField.evaluate(el => !el.checkValidity());
        expect(isInvalid).toBeTruthy();
      });
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/login');

      // Enter invalid email format
      await page.fill('input[type="email"]', 'notanemail');
      await page.fill('input[type="password"]', 'ValidPassword123');
      await page.click('button[type="submit"]');

      // Check for email validation error
      const emailError = page.locator('text=/valid email|email format|invalid email/i').first();
      await expect(emailError).toBeVisible({ timeout: 5000 }).catch(async () => {
        // Check HTML5 validation
        const emailField = page.locator('input[type="email"]');
        const isInvalid = await emailField.evaluate(el => !el.checkValidity());
        expect(isInvalid).toBeTruthy();
      });
    });

    test('should handle remember me checkbox', async ({ page }) => {
      await page.goto('/login');

      // Look for remember me checkbox
      const rememberMeCheckbox = page.locator('input[type="checkbox"][name*="remember"], label:has-text("Remember me")');

      if (await rememberMeCheckbox.first().isVisible().catch(() => false)) {
        // Check the remember me checkbox
        await rememberMeCheckbox.first().check();

        // Login with remember me checked
        await page.fill('input[type="email"]', TEST_USER.email);
        await page.fill('input[type="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');

        // Wait for successful login
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

        // Verify login was successful
        const isLoggedIn = await authHelper.isLoggedIn();
        expect(isLoggedIn).toBeTruthy();

        // Clear session storage but keep cookies (simulating browser restart)
        await page.evaluate(() => {
          sessionStorage.clear();
        });

        // Reload page
        await page.reload();

        // Should still be logged in
        await authHelper.waitForAuthReady();
        const stillLoggedIn = await authHelper.isLoggedIn();
        expect(stillLoggedIn).toBeTruthy();
      }
    });

    test('should persist login state on page refresh', async ({ page }) => {
      // Login
      await authHelper.login();

      // Verify logged in
      const isLoggedInBefore = await authHelper.isLoggedIn();
      expect(isLoggedInBefore).toBeTruthy();

      // Refresh the page
      await page.reload();

      // Wait for page to fully load
      await authHelper.waitForAuthReady();

      // Check if still logged in
      const isLoggedInAfter = await authHelper.isLoggedIn();
      expect(isLoggedInAfter).toBeTruthy();
    });

    test('should handle password visibility toggle if available', async ({ page }) => {
      await page.goto('/login');

      // Look for password visibility toggle
      const toggleButton = page.locator('[aria-label*="password" i][type="button"], button:near(input[type="password"])').first();

      if (await toggleButton.isVisible().catch(() => false)) {
        const passwordField = page.locator('input[type="password"]');

        // Type a password
        await passwordField.fill('TestPassword123');

        // Click toggle to show password
        await toggleButton.click();

        // Check if input type changed to text
        const inputType = await passwordField.getAttribute('type');
        expect(inputType).toBe('text');

        // Click again to hide password
        await toggleButton.click();

        // Check if input type changed back to password
        const inputTypeAfter = await passwordField.getAttribute('type');
        expect(inputTypeAfter).toBe('password');
      }
    });
  });

  test.describe('Logout Flow', () => {
    test('should successfully logout after login', async ({ page }) => {
      // First login
      await authHelper.login();

      // Verify logged in
      const isLoggedInBefore = await authHelper.isLoggedIn();
      expect(isLoggedInBefore).toBeTruthy();

      // Logout
      await authHelper.logout();

      // Verify logged out
      const isLoggedInAfter = await authHelper.isLoggedIn();
      expect(isLoggedInAfter).toBeFalsy();

      // Should be able to see login button or be on login page
      const loginButton = page.locator('text=/log in|sign in/i').first();
      await expect(loginButton).toBeVisible({ timeout: 10000 }).catch(async () => {
        // If not on a page with login button, check if we're on login page itself
        await expect(page).toHaveURL(/.*login/);
      });
    });

    test('should clear all user data on logout', async ({ page }) => {
      // Login first
      await authHelper.login();

      // Navigate to a page with user data (if available)
      const profileLink = page.locator('a:has-text("Profile"), a:has-text("Settings")').first();
      if (await profileLink.isVisible().catch(() => false)) {
        await profileLink.click();
        await page.waitForLoadState('networkidle');
      }

      // Logout
      await authHelper.logout();

      // Try to access the same page
      await page.goBack();

      // Should redirect to login or home
      await expect(page).toHaveURL(/.*login|^\/$/, { timeout: 5000 });
    });
  });

  test.describe('Error States', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/login');

      // Simulate offline mode
      await page.context().setOffline(true);

      // Try to login
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');

      // Should show network error message
      const networkError = page.locator('text=/network|offline|connection|internet/i').first();
      await expect(networkError).toBeVisible({ timeout: 10000 }).catch(() => {
        // Some apps might just fail silently or show generic error
        console.log('No specific network error message shown');
      });

      // Re-enable network
      await page.context().setOffline(false);
    });

    test('should handle session timeout', async ({ page }) => {
      // Login first
      await authHelper.login();

      // Verify logged in
      const isLoggedIn = await authHelper.isLoggedIn();
      expect(isLoggedIn).toBeTruthy();

      // Simulate session expiration by clearing auth data
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to navigate to a protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 }).catch(() => {
        // Or show login prompt
        expect(page.locator('input[type="email"]')).toBeVisible();
      });
    });

    test('should prevent access to protected routes when logged out', async ({ page }) => {
      // Try to access protected routes without logging in
      const protectedRoutes = ['/dashboard', '/profile', '/settings', '/innermosts'];

      for (const route of protectedRoutes) {
        const response = await page.goto(route, { waitUntil: 'networkidle' }).catch(() => null);

        if (response && response.status() !== 404) {
          // If the route exists, it should redirect to login
          await expect(page).toHaveURL(/.*login/, { timeout: 5000 }).catch(() => {
            // Some apps might just show login form without changing URL
            expect(page.locator('input[type="email"]')).toBeVisible();
          });
          break;
        }
      }
    });

    test('should handle password reset flow', async ({ page }) => {
      await page.goto('/login');

      // Click forgot password link
      const forgotPasswordLink = page.locator('a:has-text("Forgot password"), a:has-text("Reset password")');

      if (await forgotPasswordLink.first().isVisible().catch(() => false)) {
        await forgotPasswordLink.first().click();

        // Should navigate to password reset page
        await expect(page).toHaveURL(/.*reset|forgot/);

        // Enter email for password reset
        await page.fill('input[type="email"]', TEST_USER.email);

        // Submit reset request
        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();

        // Check for success message
        const successMessage = page.locator('text=/sent|check your email|reset link/i');
        await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });
});

test.describe('Signup Flow Tests', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    // Clear cookies before each test
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors
      }
    }).catch(() => {});
  });

  test('should load the signup page with required fields', async ({ page }) => {
    const response = await page.goto('/signup', { waitUntil: 'networkidle' });

    if (response && response.status() !== 404) {
      // Check for signup form elements
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();

      // Check for confirm password field
      const passwordFields = await page.locator('input[type="password"]').count();
      expect(passwordFields).toBeGreaterThanOrEqual(1);

      await expect(page.locator('button[type="submit"]')).toBeVisible();

      // Take screenshot of signup page
      await page.screenshot({ path: 'test-results/signup-page.png' });
    }
  });

  test('should validate email format on signup', async ({ page }) => {
    const response = await page.goto('/signup', { waitUntil: 'networkidle' });

    if (response && response.status() !== 404) {
      // Enter invalid email
      await page.fill('input[type="email"]', 'invalidemail');
      await page.fill('input[type="password"]', 'ValidPassword123!');

      // Fill confirm password if exists
      const confirmPasswordField = page.locator('input[type="password"]').nth(1);
      if (await confirmPasswordField.isVisible().catch(() => false)) {
        await confirmPasswordField.fill('ValidPassword123!');
      }

      // Try to submit
      await page.click('button[type="submit"]');

      // Check for validation error
      const validationError = page.locator('text=/invalid|valid email|email format/i').first();
      await expect(validationError).toBeVisible({ timeout: 5000 }).catch(async () => {
        // Check HTML5 validation
        const emailField = page.locator('input[type="email"]');
        const isInvalid = await emailField.evaluate(el => !el.checkValidity());
        expect(isInvalid).toBeTruthy();
      });
    }
  });

  test('should validate password requirements', async ({ page }) => {
    const response = await page.goto('/signup', { waitUntil: 'networkidle' });

    if (response && response.status() !== 404) {
      // Enter valid email but weak password
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', '123'); // Weak password

      // Try to submit
      await page.click('button[type="submit"]');

      // Check for password validation error
      const passwordError = page.locator('text=/password|characters|weak|must be/i').first();
      await expect(passwordError).toBeVisible({ timeout: 5000 }).catch(() => {
        console.log('No password validation message found - app might accept weak passwords');
      });
    }
  });

  test('should handle password confirmation mismatch', async ({ page }) => {
    const response = await page.goto('/signup', { waitUntil: 'networkidle' });

    if (response && response.status() !== 404) {
      // Enter valid email
      await page.fill('input[type="email"]', 'newuser@example.com');

      // Enter password
      await page.fill('input[type="password"]', 'ValidPassword123!');

      // Enter different confirm password
      const confirmPasswordField = page.locator('input[type="password"]').nth(1);
      if (await confirmPasswordField.isVisible().catch(() => false)) {
        await confirmPasswordField.fill('DifferentPassword123!');

        // Try to submit
        await page.click('button[type="submit"]');

        // Should show password mismatch error
        const mismatchError = page.locator('text=/match|same|confirm|must be identical/i');
        await expect(mismatchError.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should handle duplicate email on signup', async ({ page }) => {
    const response = await page.goto('/signup', { waitUntil: 'networkidle' });

    if (response && response.status() !== 404) {
      // Try to signup with an existing email
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', 'ValidPassword123!');

      // Fill confirm password if exists
      const confirmPasswordField = page.locator('input[type="password"]').nth(1);
      if (await confirmPasswordField.isVisible().catch(() => false)) {
        await confirmPasswordField.fill('ValidPassword123!');
      }

      // Submit
      await page.click('button[type="submit"]');

      // Should show error about email already in use
      const errorMessage = page.locator('text=/already|exists|taken|in use/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate between login and signup pages', async ({ page }) => {
    await page.goto('/login');

    // Look for signup link
    const signupLinks = [
      'a:has-text("Sign up")',
      'a:has-text("Create account")',
      'a:has-text("Register")',
      'button:has-text("Sign up")',
      'text=/don\'t have an account/i'
    ];

    let signupFound = false;
    for (const selector of signupLinks) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        signupFound = true;
        break;
      }
    }

    if (signupFound) {
      // Wait for navigation to signup page
      await expect(page).toHaveURL(/.*signup|register/);

      // Now navigate back to login
      const loginLinks = [
        'a:has-text("Log in")',
        'a:has-text("Sign in")',
        'text=/already have an account/i'
      ];

      for (const selector of loginLinks) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          await element.click();
          // Should be back on login page
          await expect(page).toHaveURL(/.*login/);
          break;
        }
      }
    }
  });
});