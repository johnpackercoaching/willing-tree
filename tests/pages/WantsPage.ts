import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for the Wants page
 */
export class WantsPage extends BasePage {
  // Selectors
  private readonly pageTitle: Locator;
  private readonly createWantButton: Locator;
  private readonly wantsList: Locator;
  private readonly wantItems: Locator;
  private readonly categoryFilter: Locator;
  private readonly searchInput: Locator;
  private readonly sortDropdown: Locator;
  private readonly wantTitleInput: Locator;
  private readonly wantDescriptionInput: Locator;
  private readonly wantCategorySelect: Locator;
  private readonly wantPrioritySelect: Locator;
  private readonly saveWantButton: Locator;
  private readonly cancelButton: Locator;
  private readonly deleteButton: Locator;
  private readonly markCompleteButton: Locator;
  private readonly editButton: Locator;
  private readonly emptyState: Locator;
  private readonly loadingIndicator: Locator;
  private readonly successToast: Locator;
  private readonly errorToast: Locator;
  private readonly wantDetailsModal: Locator;
  private readonly progressBar: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators
    this.pageTitle = page.locator('h1:has-text("Wants")').or(
      page.locator('[data-testid="wants-title"]')
    );
    this.createWantButton = page.locator('button:has-text("Create Want")').or(
      page.locator('[data-testid="create-want"]')
    );
    this.wantsList = page.locator('[data-testid="wants-list"]').or(
      page.locator('.wants-container')
    );
    this.wantItems = page.locator('[data-testid="want-item"]').or(
      page.locator('.want-card')
    );
    this.categoryFilter = page.locator('[data-testid="category-filter"]').or(
      page.locator('select[name="category"]')
    );
    this.searchInput = page.locator('input[placeholder*="Search"]').or(
      page.locator('[data-testid="search-wants"]')
    );
    this.sortDropdown = page.locator('[data-testid="sort-wants"]').or(
      page.locator('select[name="sort"]')
    );
    this.wantTitleInput = page.locator('input[name="title"]').or(
      page.locator('[data-testid="want-title"]')
    );
    this.wantDescriptionInput = page.locator('textarea[name="description"]').or(
      page.locator('[data-testid="want-description"]')
    );
    this.wantCategorySelect = page.locator('select[name="category"]').or(
      page.locator('[data-testid="want-category"]')
    );
    this.wantPrioritySelect = page.locator('select[name="priority"]').or(
      page.locator('[data-testid="want-priority"]')
    );
    this.saveWantButton = page.locator('button:has-text("Save")').or(
      page.locator('[data-testid="save-want"]')
    );
    this.cancelButton = page.locator('button:has-text("Cancel")');
    this.deleteButton = page.locator('[data-testid="delete-want"]');
    this.markCompleteButton = page.locator('[data-testid="mark-complete"]').or(
      page.locator('button:has-text("Mark Complete")')
    );
    this.editButton = page.locator('[data-testid="edit-want"]');
    this.emptyState = page.locator('[data-testid="empty-wants"]').or(
      page.locator('div:has-text("No wants found")')
    );
    this.loadingIndicator = page.locator('[data-testid="loading"]');
    this.successToast = page.locator('[data-testid="success-toast"]').or(
      page.locator('.toast-success')
    );
    this.errorToast = page.locator('[data-testid="error-toast"]').or(
      page.locator('.toast-error')
    );
    this.wantDetailsModal = page.locator('[data-testid="want-details-modal"]');
    this.progressBar = page.locator('[data-testid="wants-progress"]');
  }

  /**
   * Navigate to wants page
   */
  async goto(): Promise<WantsPage> {
    await this.navigate('/wants');
    await this.waitForPageLoad();
    return this;
  }

  /**
   * Create a new want
   */
  async createWant(
    title: string,
    description?: string,
    category?: string,
    priority?: 'low' | 'medium' | 'high'
  ): Promise<WantsPage> {
    await this.createWantButton.click();
    await this.wantTitleInput.waitFor({ state: 'visible' });
    await this.wantTitleInput.fill(title);

    if (description) {
      await this.wantDescriptionInput.fill(description);
    }

    if (category) {
      await this.wantCategorySelect.selectOption(category);
    }

    if (priority) {
      await this.wantPrioritySelect.selectOption(priority);
    }

    await this.saveWantButton.click();
    return this;
  }

  /**
   * Select a category filter
   */
  async selectCategory(category: string): Promise<WantsPage> {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForTimeout(300); // Allow filter to apply
    return this;
  }

  /**
   * Mark a want as complete by index
   */
  async markAsComplete(index: number = 0): Promise<WantsPage> {
    const wantItem = this.wantItems.nth(index);
    await wantItem.locator(this.markCompleteButton).click();
    return this;
  }

  /**
   * Mark want as complete by title
   */
  async markAsCompleteByTitle(title: string): Promise<WantsPage> {
    const wantItem = this.page.locator(`[data-testid="want-item"]:has-text("${title}")`);
    await wantItem.locator(this.markCompleteButton).click();
    return this;
  }

  /**
   * Search for wants
   */
  async searchWants(query: string): Promise<WantsPage> {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // Debounce
    return this;
  }

  /**
   * Sort wants by criteria
   */
  async sortBy(criteria: 'date' | 'priority' | 'title' | 'status'): Promise<WantsPage> {
    await this.sortDropdown.selectOption(criteria);
    await this.page.waitForTimeout(300);
    return this;
  }

  /**
   * Get count of wants
   */
  async getWantCount(): Promise<number> {
    await this.page.waitForTimeout(500); // Wait for wants to load
    return await this.wantItems.count();
  }

  /**
   * Edit a want by index
   */
  async editWant(index: number, updates: {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
  }): Promise<WantsPage> {
    const wantItem = this.wantItems.nth(index);
    await wantItem.locator(this.editButton).click();

    await this.wantTitleInput.waitFor({ state: 'visible' });

    if (updates.title) {
      await this.wantTitleInput.clear();
      await this.wantTitleInput.fill(updates.title);
    }

    if (updates.description) {
      await this.wantDescriptionInput.clear();
      await this.wantDescriptionInput.fill(updates.description);
    }

    if (updates.category) {
      await this.wantCategorySelect.selectOption(updates.category);
    }

    if (updates.priority) {
      await this.wantPrioritySelect.selectOption(updates.priority);
    }

    await this.saveWantButton.click();
    return this;
  }

  /**
   * Delete a want by index
   */
  async deleteWant(index: number = 0): Promise<WantsPage> {
    const wantItem = this.wantItems.nth(index);
    await wantItem.locator(this.deleteButton).click();

    // Confirm deletion
    await this.page.locator('button:has-text("Confirm")').click();
    return this;
  }

  /**
   * Get want details by index
   */
  async getWantDetails(index: number = 0): Promise<{
    title: string | null;
    description: string | null;
    category: string | null;
    priority: string | null;
    status: string | null;
  }> {
    const wantItem = this.wantItems.nth(index);
    return {
      title: await wantItem.locator('[data-testid="want-title"]').textContent(),
      description: await wantItem.locator('[data-testid="want-description"]').textContent(),
      category: await wantItem.locator('[data-testid="want-category"]').textContent(),
      priority: await wantItem.locator('[data-testid="want-priority"]').textContent(),
      status: await wantItem.locator('[data-testid="want-status"]').textContent()
    };
  }

  /**
   * Open want details modal
   */
  async openWantDetails(index: number = 0): Promise<WantsPage> {
    await this.wantItems.nth(index).click();
    await this.wantDetailsModal.waitFor({ state: 'visible' });
    return this;
  }

  /**
   * Close want details modal
   */
  async closeWantDetails(): Promise<WantsPage> {
    await this.page.keyboard.press('Escape');
    return this;
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Wait for wants to load
   */
  async waitForWantsToLoad(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Get success message
   */
  async getSuccessMessage(): Promise<string | null> {
    if (await this.successToast.isVisible()) {
      return await this.successToast.textContent();
    }
    return null;
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.errorToast.isVisible()) {
      return await this.errorToast.textContent();
    }
    return null;
  }

  /**
   * Get categories list
   */
  async getCategories(): Promise<string[]> {
    const options = await this.categoryFilter.locator('option').allTextContents();
    return options.filter(opt => opt !== ''); // Remove empty options
  }

  /**
   * Check if want is marked as complete
   */
  async isWantComplete(index: number = 0): Promise<boolean> {
    const wantItem = this.wantItems.nth(index);
    const statusElement = wantItem.locator('[data-testid="want-status"]');
    const status = await statusElement.textContent();
    return status?.toLowerCase() === 'complete' || false;
  }

  /**
   * Get progress percentage
   */
  async getProgressPercentage(): Promise<string | null> {
    return await this.progressBar.getAttribute('aria-valuenow');
  }

  /**
   * Check if user is on wants page
   */
  async isOnWantsPage(): Promise<boolean> {
    const url = await this.getCurrentUrl();
    return url.includes('/wants');
  }
}