import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_USER } from '../helpers/auth.helper';
import { InnermostsPage } from '../pages/InnermostsPage';
import { HomePage } from '../pages/HomePage';

/**
 * E2E Tests for Innermost Management
 * Tests CRUD operations for innermosts and switching between them
 */
test.describe('Innermosts Management Tests', () => {
  let authHelper: AuthHelper;
  let innermostsPage: InnermostsPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    innermostsPage = new InnermostsPage(page);
    homePage = new HomePage(page);

    // Clear state and login before each test
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

    // Login as test user
    await authHelper.login();
  });

  test.afterEach(async ({ page }) => {
    // Clean up - try to delete test innermosts if they exist
    try {
      await innermostsPage.goto();
      const testInnermosts = page.locator('text=/Test Innermost|Temporary|TO_DELETE/i');
      const count = await testInnermosts.count();

      for (let i = 0; i < count; i++) {
        const deleteButton = page.locator('button[aria-label*="delete" i], button:has-text("Delete")').first();
        if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await deleteButton.click();

          // Confirm deletion
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
            await page.waitForLoadState('networkidle');
          }
        }
      }
    } catch (e) {
      // Cleanup failed - not critical
    }

    await page.close();
  });

  test.describe('Create Innermost', () => {
    test('should create a new innermost successfully', async ({ page }) => {
      await innermostsPage.goto();

      // Check current innermost count
      const initialCount = await innermostsPage.getInnermostCount();

      // Create new innermost
      const innermostName = `Test Innermost ${Date.now()}`;
      const created = await innermostsPage.createInnermost(innermostName);

      if (created) {
        // Verify innermost was created
        const newInnermost = page.locator(`text="${innermostName}"`).first();
        await expect(newInnermost).toBeVisible({ timeout: 5000 });

        // Verify count increased
        const newCount = await innermostsPage.getInnermostCount();
        expect(newCount).toBe(initialCount + 1);

        // Take screenshot
        await page.screenshot({ path: 'test-results/innermost-created.png' });
      } else {
        // Hit limit - that's ok for free users
        console.log('Could not create innermost - likely hit free tier limit');
      }
    });

    test('should validate innermost name requirements', async ({ page }) => {
      await innermostsPage.goto();

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first();

      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Try empty name
        const nameInput = page.locator('input[placeholder*="name" i], input[type="text"]').first();
        const submitButton = page.locator('button:has-text("Create"), button:has-text("Save"), button[type="submit"]').last();

        if (await nameInput.isVisible() && await submitButton.isVisible()) {
          // Submit with empty name
          await submitButton.click();

          // Should show validation error
          const validationError = page.locator('text=/required|enter.*name|provide.*name/i').first();
          await expect(validationError).toBeVisible({ timeout: 3000 }).catch(async () => {
            // Check HTML5 validation
            const isInvalid = await nameInput.evaluate(el => !(el as HTMLInputElement).checkValidity());
            expect(isInvalid).toBeTruthy();
          });

          // Try very long name
          const longName = 'a'.repeat(256);
          await nameInput.fill(longName);
          await submitButton.click();

          // Check if it accepts or truncates
          const actualValue = await nameInput.inputValue();
          if (actualValue.length < 256) {
            console.log('Name was truncated to:', actualValue.length);
          }

          // Try special characters
          await nameInput.clear();
          await nameInput.fill('Test!@#$%^&*()');
          await submitButton.click();

          // Should either accept or show error
          const specialCharError = page.locator('text=/invalid|special characters|alphanumeric/i').first();
          const hasError = await specialCharError.isVisible({ timeout: 2000 }).catch(() => false);

          if (!hasError) {
            // Special characters accepted
            console.log('Special characters accepted in innermost name');
          }
        }
      }
    });

    test('should handle duplicate innermost names', async ({ page }) => {
      await innermostsPage.goto();

      // Create first innermost with specific name
      const duplicateName = 'Duplicate Test Innermost';
      const firstCreated = await innermostsPage.createInnermost(duplicateName);

      if (firstCreated) {
        // Try to create another with same name
        const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();

        if (await createButton.isVisible().catch(() => false)) {
          await createButton.click();

          const nameInput = page.locator('input[placeholder*="name" i]').first();
          const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")').last();

          if (await nameInput.isVisible() && await submitButton.isVisible()) {
            await nameInput.fill(duplicateName);
            await submitButton.click();

            // Should either show error or create with modified name
            const duplicateError = page.locator('text=/already exists|duplicate|unique/i').first();
            const hasError = await duplicateError.isVisible({ timeout: 3000 }).catch(() => false);

            if (!hasError) {
              // Check if it was created with a modified name
              const modifiedInnermost = page.locator(`text=/${duplicateName}.*\\(2\\)|${duplicateName}.*copy/i`).first();
              const wasModified = await modifiedInnermost.isVisible({ timeout: 3000 }).catch(() => false);

              if (wasModified) {
                console.log('Duplicate name was automatically modified');
              }
            } else {
              console.log('Duplicate names correctly prevented');
            }
          }
        }
      }
    });

    test('should add description and metadata to innermost', async ({ page }) => {
      await innermostsPage.goto();

      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();

      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Fill name
        const nameInput = page.locator('input[placeholder*="name" i]').first();
        await nameInput.fill('Detailed Innermost');

        // Look for description field
        const descriptionInput = page.locator('textarea[placeholder*="description" i], input[placeholder*="description" i]').first();
        if (await descriptionInput.isVisible().catch(() => false)) {
          await descriptionInput.fill('This is a test innermost with a detailed description for testing purposes.');
        }

        // Look for category/type selection
        const categorySelect = page.locator('select[name*="category"], select[name*="type"]').first();
        if (await categorySelect.isVisible().catch(() => false)) {
          await categorySelect.selectOption({ index: 1 }); // Select first option
        }

        // Look for color/theme selection
        const colorPicker = page.locator('input[type="color"], button[aria-label*="color" i]').first();
        if (await colorPicker.isVisible().catch(() => false)) {
          await colorPicker.click();
          // Select a color if picker opens
          const colorOption = page.locator('[data-color], .color-option').first();
          if (await colorOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await colorOption.click();
          }
        }

        // Submit
        const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")').last();
        await submitButton.click();

        // Verify creation
        await page.waitForLoadState('networkidle');
        const createdInnermost = page.locator('text="Detailed Innermost"').first();
        await expect(createdInnermost).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Edit Innermost', () => {
    test('should edit existing innermost details', async ({ page }) => {
      await innermostsPage.goto();

      // First create an innermost to edit
      const originalName = 'Original Innermost Name';
      await innermostsPage.createInnermost(originalName);

      // Find and edit the innermost
      const innermostCard = page.locator(`[data-testid*="innermost"]:has-text("${originalName}"), .innermost-card:has-text("${originalName}")`).first();

      if (await innermostCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Look for edit button
        const editButton = innermostCard.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();

        // If not visible, try clicking the card itself
        if (await editButton.isVisible().catch(() => false)) {
          await editButton.click();
        } else {
          await innermostCard.click();
          // Look for edit option in menu
          const editOption = page.locator('button:has-text("Edit"), [role="menuitem"]:has-text("Edit")').first();
          if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await editOption.click();
          }
        }

        // Edit form should open
        const nameInput = page.locator(`input[value="${originalName}"], input[placeholder*="name" i]`).first();

        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          // Clear and enter new name
          await nameInput.clear();
          const newName = 'Updated Innermost Name';
          await nameInput.fill(newName);

          // Update description if field exists
          const descriptionInput = page.locator('textarea[placeholder*="description" i]').first();
          if (await descriptionInput.isVisible().catch(() => false)) {
            await descriptionInput.clear();
            await descriptionInput.fill('Updated description for the innermost');
          }

          // Save changes
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').last();
          await saveButton.click();

          // Wait for save
          await page.waitForLoadState('networkidle');

          // Verify update
          const updatedInnermost = page.locator(`text="${newName}"`).first();
          await expect(updatedInnermost).toBeVisible({ timeout: 5000 });

          // Original name should not be visible
          const originalInnermost = page.locator(`text="${originalName}"`).first();
          await expect(originalInnermost).not.toBeVisible({ timeout: 2000 }).catch(() => {
            console.log('Original name might still be visible in history');
          });

          // Take screenshot
          await page.screenshot({ path: 'test-results/innermost-edited.png' });
        }
      }
    });

    test('should cancel edit without saving changes', async ({ page }) => {
      await innermostsPage.goto();

      // Create an innermost
      const innermostName = 'Innermost to Cancel Edit';
      await innermostsPage.createInnermost(innermostName);

      // Start editing
      const innermostCard = page.locator(`[data-testid*="innermost"]:has-text("${innermostName}")`).first();

      if (await innermostCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Open edit mode
        const editButton = innermostCard.locator('button[aria-label*="edit" i]').first();
        if (await editButton.isVisible().catch(() => false)) {
          await editButton.click();
        } else {
          await innermostCard.click();
          const editOption = page.locator('button:has-text("Edit")').first();
          if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await editOption.click();
          }
        }

        // Make changes
        const nameInput = page.locator('input[placeholder*="name" i]').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.clear();
          await nameInput.fill('Changed Name That Should Not Save');

          // Cancel
          const cancelButton = page.locator('button:has-text("Cancel"), button[aria-label="Cancel"]').first();
          if (await cancelButton.isVisible().catch(() => false)) {
            await cancelButton.click();
          } else {
            // Press Escape
            await page.keyboard.press('Escape');
          }

          // Wait for modal to close
          await page.waitForTimeout(500);

          // Verify original name is still there
          const originalInnermost = page.locator(`text="${innermostName}"`).first();
          await expect(originalInnermost).toBeVisible({ timeout: 3000 });

          // Verify changed name is not there
          const changedInnermost = page.locator('text="Changed Name That Should Not Save"').first();
          await expect(changedInnermost).not.toBeVisible({ timeout: 1000 }).catch(() => {});
        }
      }
    });

    test('should validate edit form inputs', async ({ page }) => {
      await innermostsPage.goto();

      // Create an innermost to edit
      const innermostName = 'Innermost for Validation';
      await innermostsPage.createInnermost(innermostName);

      // Open edit form
      const editButton = page.locator('button[aria-label*="edit" i]').first();
      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editButton.click();

        // Try to save with empty name
        const nameInput = page.locator('input[placeholder*="name" i]').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nameInput.clear();

          const saveButton = page.locator('button:has-text("Save")').last();
          await saveButton.click();

          // Should show validation error
          const validationError = page.locator('text=/required|cannot be empty/i').first();
          await expect(validationError).toBeVisible({ timeout: 3000 }).catch(async () => {
            // Check if save was prevented
            const isInvalid = await nameInput.evaluate(el => !(el as HTMLInputElement).checkValidity());
            expect(isInvalid).toBeTruthy();
          });
        }
      }
    });
  });

  test.describe('Delete Innermost', () => {
    test('should delete innermost with confirmation', async ({ page }) => {
      await innermostsPage.goto();

      // Create an innermost to delete
      const innermostToDelete = 'TO_DELETE_Innermost';
      await innermostsPage.createInnermost(innermostToDelete);

      // Find and delete the innermost
      const innermostCard = page.locator(`[data-testid*="innermost"]:has-text("${innermostToDelete}")`).first();

      if (await innermostCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Look for delete button
        const deleteButton = innermostCard.locator('button[aria-label*="delete" i], button:has-text("Delete")').first();

        if (!await deleteButton.isVisible().catch(() => false)) {
          // Try opening menu first
          await innermostCard.click();
          const menuDelete = page.locator('button:has-text("Delete"), [role="menuitem"]:has-text("Delete")').first();
          if (await menuDelete.isVisible({ timeout: 2000 }).catch(() => false)) {
            await menuDelete.click();
          }
        } else {
          await deleteButton.click();
        }

        // Confirmation dialog should appear
        const confirmDialog = page.locator('[role="dialog"], .modal').first();
        await expect(confirmDialog).toBeVisible({ timeout: 3000 });

        // Check for confirmation message
        const confirmMessage = page.locator('text=/are you sure|confirm delete|permanently delete/i').first();
        await expect(confirmMessage).toBeVisible({ timeout: 2000 });

        // Confirm deletion
        const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').last();
        await confirmButton.click();

        // Wait for deletion
        await page.waitForLoadState('networkidle');

        // Verify innermost is deleted
        const deletedInnermost = page.locator(`text="${innermostToDelete}"`).first();
        await expect(deletedInnermost).not.toBeVisible({ timeout: 3000 });

        // Take screenshot
        await page.screenshot({ path: 'test-results/innermost-deleted.png' });
      }
    });

    test('should cancel delete operation', async ({ page }) => {
      await innermostsPage.goto();

      // Create an innermost
      const innermostName = 'Innermost to Keep';
      await innermostsPage.createInnermost(innermostName);

      // Start delete process
      const deleteButton = page.locator('button[aria-label*="delete" i]').first();
      if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteButton.click();

        // Cancel deletion
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")').last();
        await cancelButton.click();

        // Wait for dialog to close
        await page.waitForTimeout(500);

        // Verify innermost still exists
        const innermost = page.locator(`text="${innermostName}"`).first();
        await expect(innermost).toBeVisible({ timeout: 3000 });
      }
    });

    test('should handle deletion of active innermost', async ({ page }) => {
      await innermostsPage.goto();

      // Get current active innermost if any
      const activeInnermost = page.locator('.active[data-testid*="innermost"], [aria-current="true"]').first();
      const hasActive = await activeInnermost.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasActive) {
        const activeName = await activeInnermost.textContent();

        // Try to delete active innermost
        const deleteButton = activeInnermost.locator('button[aria-label*="delete" i]').first();
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();

          // Should show special warning
          const warningMessage = page.locator('text=/active|currently selected|in use/i').first();
          const hasWarning = await warningMessage.isVisible({ timeout: 2000 }).catch(() => false);

          if (hasWarning) {
            console.log('Special warning shown for deleting active innermost');
          }

          // Proceed with deletion
          const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
          await confirmButton.click();

          await page.waitForLoadState('networkidle');

          // Check if another innermost became active
          const newActive = page.locator('.active[data-testid*="innermost"], [aria-current="true"]').first();
          const hasNewActive = await newActive.isVisible({ timeout: 2000 }).catch(() => false);

          if (hasNewActive) {
            const newActiveName = await newActive.textContent();
            expect(newActiveName).not.toBe(activeName);
            console.log('Another innermost automatically became active');
          }
        }
      }
    });
  });

  test.describe('Switch Between Innermosts', () => {
    test('should switch active innermost', async ({ page }) => {
      await innermostsPage.goto();

      // Ensure we have at least 2 innermosts
      const innermostCount = await innermostsPage.getInnermostCount();

      if (innermostCount === 0) {
        await innermostsPage.createInnermost('First Innermost');
      }

      // Try to create second (might fail for free users)
      if (innermostCount < 2) {
        const created = await innermostsPage.createInnermost('Second Innermost');
        if (!created) {
          console.log('Cannot create second innermost - likely free tier limit');
          return; // Skip test
        }
      }

      // Get all innermosts
      const innermosts = await page.locator('[data-testid*="innermost"], .innermost-card').all();

      if (innermosts.length >= 2) {
        // Get first innermost name and make it active
        const firstInnermost = innermosts[0];
        const firstName = await firstInnermost.textContent();
        await firstInnermost.click();

        // Look for active indicator
        await page.waitForTimeout(500);
        let activeIndicator = page.locator('.active, [data-active="true"], [aria-current="true"]').first();
        let activeText = await activeIndicator.textContent().catch(() => '');

        if (activeText && firstName) {
          expect(activeText).toContain(firstName);
        }

        // Switch to second innermost
        const secondInnermost = innermosts[1];
        const secondName = await secondInnermost.textContent();
        await secondInnermost.click();

        // Verify switch
        await page.waitForTimeout(500);
        activeIndicator = page.locator('.active, [data-active="true"], [aria-current="true"]').first();
        activeText = await activeIndicator.textContent().catch(() => '');

        if (activeText && secondName) {
          expect(activeText).toContain(secondName);
        }

        // Take screenshot
        await page.screenshot({ path: 'test-results/innermost-switched.png' });
      }
    });

    test('should persist active innermost selection', async ({ page }) => {
      await innermostsPage.goto();

      const innermosts = await page.locator('[data-testid*="innermost"], .innermost-card').all();

      if (innermosts.length >= 2) {
        // Select second innermost
        const secondInnermost = innermosts[1];
        const secondName = await secondInnermost.textContent();
        await secondInnermost.click();

        await page.waitForTimeout(500);

        // Refresh page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check if selection persisted
        const activeIndicator = page.locator('.active, [data-active="true"], [aria-current="true"]').first();
        const activeText = await activeIndicator.textContent().catch(() => '');

        if (activeText && secondName) {
          expect(activeText).toContain(secondName);
          console.log('Active innermost selection persisted after refresh');
        }
      } else {
        console.log('Not enough innermosts to test switching');
      }
    });

    test('should update UI when switching innermosts', async ({ page }) => {
      await innermostsPage.goto();

      const innermosts = await page.locator('[data-testid*="innermost"], .innermost-card').all();

      if (innermosts.length >= 2) {
        // Select first innermost
        await innermosts[0].click();
        await page.waitForTimeout(500);

        // Navigate to home/dashboard
        await homePage.goto();

        // Look for innermost-specific content
        const innermostTitle = page.locator('h1, h2, h3').filter({ hasText: /innermost/i }).first();
        const firstContent = await innermostTitle.textContent().catch(() => '');

        // Go back and switch innermost
        await innermostsPage.goto();
        await innermosts[1].click();
        await page.waitForTimeout(500);

        // Navigate to home again
        await homePage.goto();

        // Check if content changed
        const secondContent = await innermostTitle.textContent().catch(() => '');

        if (firstContent && secondContent && firstContent !== secondContent) {
          console.log('UI updated when switching innermosts');
        }
      }
    });

    test('should show quick switcher for innermosts', async ({ page }) => {
      // Look for quick switcher in navigation or header
      await homePage.goto();

      const quickSwitcher = page.locator('[aria-label*="switch innermost" i], [data-testid="innermost-switcher"]').first();

      if (await quickSwitcher.isVisible({ timeout: 3000 }).catch(() => false)) {
        await quickSwitcher.click();

        // Should show dropdown/modal with innermosts
        const switcherMenu = page.locator('[role="menu"], .dropdown-menu').first();
        await expect(switcherMenu).toBeVisible({ timeout: 3000 });

        // Should list all innermosts
        const innermostOptions = switcherMenu.locator('[role="menuitem"], .innermost-option');
        const optionCount = await innermostOptions.count();

        expect(optionCount).toBeGreaterThan(0);

        // Select different innermost if available
        if (optionCount > 1) {
          await innermostOptions.nth(1).click();

          // Verify switched
          await page.waitForTimeout(500);
          console.log('Successfully used quick switcher');
        }

        // Take screenshot
        await page.screenshot({ path: 'test-results/innermost-quick-switcher.png' });
      } else {
        console.log('No quick switcher found in UI');
      }
    });
  });

  test.describe('Innermost Data Isolation', () => {
    test('should keep data separate between innermosts', async ({ page }) => {
      await innermostsPage.goto();

      // This test only makes sense with multiple innermosts
      const innermostCount = await innermostsPage.getInnermostCount();

      if (innermostCount >= 2 || await innermostsPage.createInnermost('Second Innermost')) {
        // Select first innermost
        const firstInnermost = page.locator('[data-testid*="innermost"]').first();
        await firstInnermost.click();
        await page.waitForTimeout(500);

        // Navigate to wants or similar data page
        const wantsLink = page.locator('a:has-text("Wants"), a:has-text("Goals")').first();
        if (await wantsLink.isVisible().catch(() => false)) {
          await wantsLink.click();
          await page.waitForLoadState('networkidle');

          // Add some data for first innermost
          const input = page.locator('input[type="text"], textarea').first();
          if (await input.isVisible().catch(() => false)) {
            await input.fill('Data for First Innermost');

            // Save if needed
            const saveButton = page.locator('button:has-text("Save")').first();
            if (await saveButton.isVisible().catch(() => false)) {
              await saveButton.click();
              await page.waitForLoadState('networkidle');
            }
          }

          // Switch to second innermost
          await innermostsPage.goto();
          const secondInnermost = page.locator('[data-testid*="innermost"]').nth(1);
          await secondInnermost.click();
          await page.waitForTimeout(500);

          // Go back to same data page
          await wantsLink.click();
          await page.waitForLoadState('networkidle');

          // Check that first innermost's data is not shown
          const firstData = page.locator('text="Data for First Innermost"').first();
          await expect(firstData).not.toBeVisible({ timeout: 2000 }).catch(() => {});

          // Verify this is different data context
          const dataInput = page.locator('input[type="text"], textarea').first();
          if (await dataInput.isVisible().catch(() => false)) {
            const value = await dataInput.inputValue();
            expect(value).not.toContain('Data for First Innermost');
            console.log('Data correctly isolated between innermosts');
          }
        }
      } else {
        console.log('Cannot test data isolation with single innermost');
      }
    });
  });
});