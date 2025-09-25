import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for the Login page
 */
export class LoginPage extends BasePage {
  // Selectors
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly showPasswordButton: Locator;
  private readonly signupLink: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly errorMessage: Locator;
  private readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using best practices
    this.emailInput = page.locator('input[type="email"]').or(page.locator('[data-testid="login-email"]'));
    this.passwordInput = page.locator('input[type="password"]').or(page.locator('[data-testid="login-password"]'));
    this.submitButton = page.locator('button[type="submit"]').or(page.locator('[data-testid="login-submit"]'));
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]').or(page.locator('[data-testid="remember-me"]'));
    this.showPasswordButton = page.locator('button:has-text("Show Password")').or(page.locator('[data-testid="show-password"]'));
    this.signupLink = page.locator('a:has-text("Sign Up")').or(page.locator('[data-testid="signup-link"]'));
    this.forgotPasswordLink = page.locator('a:has-text("Forgot Password")').or(page.locator('[data-testid="forgot-password-link"]'));
    this.errorMessage = page.locator('[role="alert"]').or(page.locator('[data-testid="login-error"]'));
    this.pageTitle = page.locator('h1:has-text("The WillingTree")');
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<LoginPage> {
    await this.navigate('/login');
    await this.waitForPageLoad();
    return this;
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string): Promise<LoginPage> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    return this;
  }

  /**
   * Quick login with remember me option
   */
  async loginWithRememberMe(email: string, password: string): Promise<LoginPage> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.rememberMeCheckbox.check();
    await this.submitButton.click();
    return this;
  }

  /**
   * Navigate to signup page
   */
  async navigateToSignup(): Promise<void> {
    await this.signupLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to forgot password page
   */
  async navigateToForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.waitForNavigation();
  }

  /**
   * Toggle password visibility
   */
  async togglePasswordVisibility(): Promise<LoginPage> {
    await this.showPasswordButton.click();
    return this;
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.emailInput.isVisible() &&
           await this.passwordInput.isVisible() &&
           await this.submitButton.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Check if remember me is checked
   */
  async isRememberMeChecked(): Promise<boolean> {
    return await this.rememberMeCheckbox.isChecked();
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<LoginPage> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
    if (await this.isRememberMeChecked()) {
      await this.rememberMeCheckbox.uncheck();
    }
    return this;
  }

  /**
   * Wait for login to complete (either success or error)
   */
  async waitForLoginResult(): Promise<void> {
    // Wait for either navigation away from login or error message
    await Promise.race([
      this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 })
    ]).catch(() => {
      // Continue if neither happens within timeout
    });
  }

  /**
   * Check if user is on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    const url = await this.getCurrentUrl();
    return url.includes('/login');
  }
}