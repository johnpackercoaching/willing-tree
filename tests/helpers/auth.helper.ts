import { Page, expect } from '@playwright/test';

/**
 * Test user credentials
 */
export const TEST_USER = {
  email: 'willingtree.test.2024@gmail.com',
  password: 'TestUser2024!Secure'
};

/**
 * Authentication helper functions for Willing Tree tests
 */
export class AuthHelper {
  constructor(private page: Page) {
    this.setupConsoleLogging();
  }

  /**
   * Set up comprehensive console logging to capture all browser output
   */
  private setupConsoleLogging() {
    // Capture all console messages with color coding
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const colors = {
        'error': '\x1b[31m',   // Red
        'warning': '\x1b[33m', // Yellow
        'info': '\x1b[36m',    // Cyan
        'log': '\x1b[37m',     // White
        'debug': '\x1b[90m'    // Gray
      };
      const color = colors[type] || '\x1b[37m';
      console.log(`${color}[BROWSER ${type.toUpperCase()}] ${text}\x1b[0m`);

      // Special handling for Firebase errors
      if (text.includes('Firebase') && (text.includes('Error') || text.includes('error'))) {
        console.log('\x1b[91m  🔥 FIREBASE ERROR DETECTED! Check API keys and configuration.\x1b[0m');
      }
    });

    // Capture page errors (JavaScript exceptions)
    this.page.on('pageerror', (error) => {
      console.error('\x1b[31m[PAGE ERROR] JavaScript exception in browser:\x1b[0m');
      console.error('\x1b[31m  Message:', error.message, '\x1b[0m');
      if (error.stack) {
        console.error('\x1b[31m  Stack:', error.stack, '\x1b[0m');
      }
    });

    // Capture failed network requests
    this.page.on('requestfailed', (request) => {
      const failure = request.failure();
      console.error('\x1b[31m[NETWORK FAILED] Request failed:\x1b[0m');
      console.error(`\x1b[31m  URL: ${request.url()}\x1b[0m`);
      console.error(`\x1b[31m  Method: ${request.method()}\x1b[0m`);
      if (failure) {
        console.error(`\x1b[31m  Error: ${failure.errorText}\x1b[0m`);
      }
    });

    // Capture HTTP errors (4xx, 5xx)
    this.page.on('response', (response) => {
      if (response.status() >= 400) {
        const color = response.status() >= 500 ? '\x1b[31m' : '\x1b[33m'; // Red for 5xx, Yellow for 4xx
        console.log(`${color}[HTTP ${response.status()}] ${response.url()}\x1b[0m`);
      }
    });

    // Add debug mode with pause on error
    if (process.env.DEBUG_ON_ERROR === 'true') {
      this.page.on('pageerror', async () => {
        console.log('\x1b[35m⏸️  Pausing on error - Browser Inspector opened for debugging\x1b[0m');
        await this.page.pause();
      });
    }
  }

  /**
   * Login with test user credentials
   */
  async login(email: string = TEST_USER.email, password: string = TEST_USER.password) {
    // Navigate to login page
    await this.page.goto('/login');
    
    // Wait for the login form to be visible
    await this.page.waitForSelector('form', { timeout: 10000 });
    
    // Fill in the email field
    await this.page.fill('input[type="email"]', email);
    
    // Fill in the password field
    await this.page.fill('input[type="password"]', password);
    
    // Click the submit button
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation after successful login
    // Adjust the URL pattern based on where users are redirected after login
    await this.page.waitForURL('**/dashboard/**', { timeout: 15000 }).catch(() => {
      // If dashboard redirect fails, check for any successful navigation
      return this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    });
    
    // Verify login was successful by checking for common post-login elements
    await expect(this.page.locator('text=/logout|sign out|profile/i').first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Logout from the application
   */
  async logout() {
    // Try different logout selectors
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign Out")',
      'a:has-text("Logout")',
      'a:has-text("Sign Out")',
      '[aria-label="Logout"]',
      '[aria-label="Sign Out"]'
    ];

    let logoutFound = false;
    
    for (const selector of logoutSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click();
        logoutFound = true;
        break;
      }
    }

    if (!logoutFound) {
      // If no logout button found, try opening a menu first
      const menuSelectors = [
        '[aria-label="User menu"]',
        '[aria-label="Profile"]',
        'button:has-text("Account")',
        '[data-testid="user-menu"]'
      ];

      for (const menuSelector of menuSelectors) {
        const menuElement = this.page.locator(menuSelector).first();
        if (await menuElement.isVisible().catch(() => false)) {
          await menuElement.click();
          await this.page.waitForTimeout(500); // Wait for menu to open
          
          // Try logout selectors again
          for (const selector of logoutSelectors) {
            const element = this.page.locator(selector).first();
            if (await element.isVisible().catch(() => false)) {
              await element.click();
              logoutFound = true;
              break;
            }
          }
          
          if (logoutFound) break;
        }
      }
    }

    if (logoutFound) {
      // Wait for redirect to login page
      await this.page.waitForURL('**/login', { timeout: 10000 }).catch(() => {
        // If not redirected to login, check if we're on the home page
        return this.page.waitForURL('/', { timeout: 10000 });
      });
    }
  }

  /**
   * Check if user is currently logged in
   */
  async isLoggedIn(): Promise<boolean> {
    // Check for common indicators of being logged in
    const loggedInSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign Out")',
      'a:has-text("Dashboard")',
      '[data-testid="user-avatar"]',
      '[aria-label="User menu"]'
    ];

    for (const selector of loggedInSelectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Navigate to signup page and create a new account
   */
  async signup(email: string, password: string, confirmPassword?: string) {
    // Navigate to signup page
    await this.page.goto('/signup');
    
    // Wait for the signup form to be visible
    await this.page.waitForSelector('form', { timeout: 10000 });
    
    // Fill in the email field
    await this.page.fill('input[type="email"]', email);
    
    // Fill in the password field
    await this.page.fill('input[type="password"]', password);
    
    // Fill in confirm password if field exists
    const confirmPasswordField = this.page.locator('input[type="password"]').nth(1);
    if (await confirmPasswordField.isVisible().catch(() => false)) {
      await confirmPasswordField.fill(confirmPassword || password);
    }
    
    // Check for any additional required fields
    const nameField = this.page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameField.isVisible().catch(() => false)) {
      await nameField.fill('Test User');
    }
    
    // Accept terms if checkbox exists
    const termsCheckbox = this.page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible().catch(() => false)) {
      await termsCheckbox.check();
    }
    
    // Click the submit button
    await this.page.click('button[type="submit"]');
    
    // Wait for navigation after successful signup
    await this.page.waitForURL((url) => !url.pathname.includes('/signup'), { timeout: 15000 });
  }

  /**
   * Wait for authentication state to be ready
   */
  async waitForAuthReady() {
    // Wait for any loading indicators to disappear
    await this.page.waitForSelector('.loading, .spinner, [data-loading="true"]', { 
      state: 'hidden', 
      timeout: 5000 
    }).catch(() => {});
    
    // Additional wait to ensure auth state is settled
    await this.page.waitForTimeout(1000);
  }
}
