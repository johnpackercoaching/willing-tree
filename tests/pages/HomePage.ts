import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for the Home/Dashboard page
 */
export class HomePage extends BasePage {
  // Selectors
  private readonly welcomeHeader: Locator;
  private readonly userGreeting: Locator;
  private readonly treeCount: Locator;
  private readonly leavesCount: Locator;
  private readonly plantTreeButton: Locator;
  private readonly innermostsLink: Locator;
  private readonly wantsLink: Locator;
  private readonly profileLink: Locator;
  private readonly settingsLink: Locator;
  private readonly analyticsLink: Locator;
  private readonly innermostCards: Locator;
  private readonly addInnermostButton: Locator;
  private readonly quickActionButtons: Locator;
  private readonly navigationMenu: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.welcomeHeader = page.locator('h1:has-text("The WillingTree")');
    this.userGreeting = page.locator('p:has-text("Welcome back")');
    this.treeCount = page.locator('[data-testid="tree-count"]').or(
      page.locator('div:has-text("Growing Trees") >> .. >> div.text-2xl')
    );
    this.leavesCount = page.locator('[data-testid="leaves-count"]').or(
      page.locator('div:has-text("Leaves Grown") >> .. >> div.text-2xl')
    );
    this.plantTreeButton = page.locator('button:has-text("Plant a Tree")').or(
      page.locator('[data-testid="plant-tree-button"]')
    );
    this.innermostsLink = page.locator('a[href="/innermosts"]');
    this.wantsLink = page.locator('a[href="/wants"]');
    this.profileLink = page.locator('a[href="/profile"]');
    this.settingsLink = page.locator('a[href="/settings"]');
    this.analyticsLink = page.locator('a[href="/analytics"]');
    this.innermostCards = page.locator('[data-testid="innermost-card"]').or(
      page.locator('div.bg-white.rounded-xl:has(button:has-text("Tend to Tree"))')
    );
    this.addInnermostButton = page.locator('button:has(svg.lucide-plus)').or(
      page.locator('[data-testid="add-innermost"]')
    );
    this.quickActionButtons = page.locator('[data-testid="quick-action"]');
    this.navigationMenu = page.locator('nav').or(page.locator('[data-testid="navigation"]'));
  }

  /**
   * Navigate to home page
   */
  async goto(): Promise<HomePage> {
    await this.navigate('/');
    await this.waitForPageLoad();
    return this;
  }

  /**
   * Navigate to Innermosts page
   */
  async navigateToInnermosts(): Promise<void> {
    await this.innermostsLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Wants page
   */
  async navigateToWants(): Promise<void> {
    await this.wantsLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Profile page
   */
  async navigateToProfile(): Promise<void> {
    await this.profileLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Settings page
   */
  async navigateToSettings(): Promise<void> {
    await this.settingsLink.click();
    await this.waitForNavigation();
  }

  /**
   * Navigate to Analytics page
   */
  async navigateToAnalytics(): Promise<void> {
    await this.analyticsLink.click();
    await this.waitForNavigation();
  }

  /**
   * Get stats summary
   */
  async getStatsSummary(): Promise<{
    treeCount: string | null;
    leavesCount: string | null;
  }> {
    return {
      treeCount: await this.treeCount.textContent(),
      leavesCount: await this.leavesCount.textContent()
    };
  }

  /**
   * Get user display name from greeting
   */
  async getUserDisplayName(): Promise<string | null> {
    const greeting = await this.userGreeting.textContent();
    if (greeting) {
      const match = greeting.match(/Welcome back, (.+?)!/);
      return match ? match[1] : null;
    }
    return null;
  }

  /**
   * Click plant tree button (for new users)
   */
  async clickPlantTree(): Promise<void> {
    await this.plantTreeButton.click();
    await this.waitForNavigation();
  }

  /**
   * Get count of innermost cards displayed
   */
  async getInnermostCardCount(): Promise<number> {
    return await this.innermostCards.count();
  }

  /**
   * Click on a specific innermost card by index
   */
  async clickInnermostCard(index: number = 0): Promise<void> {
    await this.innermostCards.nth(index).locator('button').click();
    await this.waitForNavigation();
  }

  /**
   * Get innermost card details by index
   */
  async getInnermostCardDetails(index: number = 0): Promise<{
    partnerEmail: string | null;
    status: string | null;
    createdDate: string | null;
  }> {
    const card = this.innermostCards.nth(index);
    return {
      partnerEmail: await card.locator('.font-medium').first().textContent(),
      status: await card.locator('.rounded-full').textContent(),
      createdDate: await card.locator('.text-sm.text-gray-600').textContent()
    };
  }

  /**
   * Check if add innermost button is visible
   */
  async canAddInnermost(): Promise<boolean> {
    return await this.addInnermostButton.isVisible();
  }

  /**
   * Click add innermost button
   */
  async clickAddInnermost(): Promise<void> {
    await this.addInnermostButton.click();
    await this.waitForNavigation();
  }

  /**
   * Check if user is on home page
   */
  async isOnHomePage(): Promise<boolean> {
    const url = await this.getCurrentUrl();
    return url === '/' || url.endsWith('/home') || url.endsWith('#/');
  }

  /**
   * Check if welcome header is visible
   */
  async isWelcomeHeaderVisible(): Promise<boolean> {
    return await this.welcomeHeader.isVisible();
  }

  /**
   * Perform a quick action by name
   */
  async performQuickAction(actionName: string): Promise<void> {
    await this.page.locator(`button:has-text("${actionName}")`).click();
    await this.waitForNavigation();
  }

  /**
   * Check if navigation menu is visible
   */
  async isNavigationVisible(): Promise<boolean> {
    return await this.navigationMenu.isVisible();
  }
}