import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for the Innermosts page
 */
export class InnermostsPage extends BasePage {
  // Selectors
  private readonly pageTitle: Locator;
  private readonly createButton: Locator;
  private readonly innermostCards: Locator;
  private readonly searchInput: Locator;
  private readonly filterButtons: Locator;
  private readonly emptyState: Locator;
  private readonly loadingSpinner: Locator;
  private readonly partnerEmailInput: Locator;
  private readonly inviteButton: Locator;
  private readonly cancelButton: Locator;
  private readonly deleteButton: Locator;
  private readonly confirmModal: Locator;
  private readonly successMessage: Locator;
  private readonly errorMessage: Locator;
  private readonly statusBadge: Locator;
  private readonly treeProgressBar: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.pageTitle = page.locator('h1:has-text("Innermosts")').or(
      page.locator('[data-testid="innermosts-title"]')
    );
    this.createButton = page.locator('button:has-text("Create")').or(
      page.locator('[data-testid="create-innermost"]')
    );
    this.innermostCards = page.locator('[data-testid="innermost-card"]').or(
      page.locator('.innermost-card')
    );
    this.searchInput = page.locator('input[placeholder*="Search"]').or(
      page.locator('[data-testid="search-innermosts"]')
    );
    this.filterButtons = page.locator('[data-testid="filter-button"]').or(
      page.locator('button[role="tab"]')
    );
    this.emptyState = page.locator('[data-testid="empty-state"]').or(
      page.locator('div:has-text("No innermosts found")')
    );
    this.loadingSpinner = page.locator('[data-testid="loading"]').or(
      page.locator('.spinner')
    );
    this.partnerEmailInput = page.locator('input[placeholder*="email"]').or(
      page.locator('[data-testid="partner-email"]')
    );
    this.inviteButton = page.locator('button:has-text("Invite")').or(
      page.locator('[data-testid="invite-partner"]')
    );
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.deleteButton = page.locator('button:has-text("Delete")').or(
      page.locator('[data-testid="delete-innermost"]')
    );
    this.confirmModal = page.locator('[role="dialog"]').or(
      page.locator('[data-testid="confirm-modal"]')
    );
    this.successMessage = page.locator('[data-testid="success-message"]').or(
      page.locator('.toast-success')
    );
    this.errorMessage = page.locator('[data-testid="error-message"]').or(
      page.locator('.toast-error')
    );
    this.statusBadge = page.locator('[data-testid="status-badge"]');
    this.treeProgressBar = page.locator('[data-testid="tree-progress"]');
  }

  /**
   * Navigate to innermosts page
   */
  async goto(): Promise<InnermostsPage> {
    await this.navigate('/innermosts');
    await this.waitForPageLoad();
    return this;
  }

  /**
   * Create a new innermost with partner email
   */
  async createInnermost(partnerEmail: string): Promise<InnermostsPage> {
    await this.createButton.click();
    await this.partnerEmailInput.waitFor({ state: 'visible' });
    await this.partnerEmailInput.fill(partnerEmail);
    await this.inviteButton.click();
    return this;
  }

  /**
   * Select an innermost by index
   */
  async selectInnermost(index: number = 0): Promise<void> {
    await this.innermostCards.nth(index).click();
    await this.waitForNavigation();
  }

  /**
   * Select innermost by partner email
   */
  async selectInnermostByEmail(email: string): Promise<void> {
    await this.page.locator(`[data-testid="innermost-card"]:has-text("${email}")`).click();
    await this.waitForNavigation();
  }

  /**
   * Get total count of innermosts
   */
  async getInnermostCount(): Promise<number> {
    await this.page.waitForTimeout(500); // Wait for cards to load
    return await this.innermostCards.count();
  }

  /**
   * Search for innermosts
   */
  async searchInnermosts(query: string): Promise<InnermostsPage> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Debounce
    return this;
  }

  /**
   * Filter innermosts by status
   */
  async filterByStatus(status: 'all' | 'active' | 'pending' | 'archived'): Promise<InnermostsPage> {
    await this.filterButtons.filter({ hasText: status }).click();
    await this.page.waitForTimeout(300);
    return this;
  }

  /**
   * Delete an innermost by index
   */
  async deleteInnermost(index: number = 0): Promise<InnermostsPage> {
    const card = this.innermostCards.nth(index);
    await card.hover();
    await card.locator(this.deleteButton).click();

    // Handle confirmation
    await this.confirmModal.waitFor({ state: 'visible' });
    await this.page.locator('button:has-text("Confirm")').click();
    return this;
  }

  /**
   * Check if empty state is shown
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Get innermost details by index
   */
  async getInnermostDetails(index: number = 0): Promise<{
    partnerEmail: string | null;
    status: string | null;
    createdDate: string | null;
    treeProgress: string | null;
  }> {
    const card = this.innermostCards.nth(index);
    return {
      partnerEmail: await card.locator('[data-testid="partner-email"]').textContent(),
      status: await card.locator(this.statusBadge).textContent(),
      createdDate: await card.locator('[data-testid="created-date"]').textContent(),
      treeProgress: await card.locator(this.treeProgressBar).getAttribute('aria-valuenow')
    };
  }

  /**
   * Wait for innermosts to load
   */
  async waitForInnermostsToLoad(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Check if create button is enabled
   */
  async isCreateButtonEnabled(): Promise<boolean> {
    return await this.createButton.isEnabled();
  }

  /**
   * Cancel innermost creation
   */
  async cancelInnermostCreation(): Promise<InnermostsPage> {
    await this.cancelButton.click();
    return this;
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string | null> {
    if (await this.successMessage.isVisible()) {
      return await this.successMessage.textContent();
    }
    return null;
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
   * Accept innermost invitation
   */
  async acceptInvitation(index: number = 0): Promise<InnermostsPage> {
    const card = this.innermostCards.nth(index);
    await card.locator('button:has-text("Accept")').click();
    return this;
  }

  /**
   * Decline innermost invitation
   */
  async declineInvitation(index: number = 0): Promise<InnermostsPage> {
    const card = this.innermostCards.nth(index);
    await card.locator('button:has-text("Decline")').click();
    return this;
  }

  /**
   * Check if user is on innermosts page
   */
  async isOnInnermostsPage(): Promise<boolean> {
    const url = await this.getCurrentUrl();
    return url.includes('/innermosts');
  }

  /**
   * View tree details for an innermost
   */
  async viewTreeDetails(index: number = 0): Promise<void> {
    const card = this.innermostCards.nth(index);
    await card.locator('button:has-text("View Tree")').click();
    await this.waitForNavigation();
  }
}