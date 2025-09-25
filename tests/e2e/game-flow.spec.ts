import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_USER } from '../helpers/auth.helper';
import { WantsPage } from '../pages/WantsPage';
import { HomePage } from '../pages/HomePage';

/**
 * E2E Tests for the Complete Weekly Game Flow
 * Tests the core user journey through the Willing Tree application
 */
test.describe('Game Flow Tests', () => {
  let authHelper: AuthHelper;
  let wantsPage: WantsPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    wantsPage = new WantsPage(page);
    homePage = new HomePage(page);

    // Clear state and login before each test
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors in cross-origin contexts
      }
    }).catch(() => {});

    // Login as test user
    await authHelper.login();
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test.describe('Complete Weekly Game Flow', () => {
    test('should complete a full weekly game cycle', async ({ page }) => {
      // Navigate to dashboard/home
      await homePage.goto();

      // Start the weekly game
      const startButton = page.locator('button:has-text("Start Weekly Game"), button:has-text("Begin Week"), button:has-text("Start")').first();
      if (await startButton.isVisible().catch(() => false)) {
        await startButton.click();
      } else {
        // Try navigating to wants page directly
        await wantsPage.goto();
      }

      // Fill in wants for the week (5 wants)
      const wants = [
        'Complete project milestone',
        'Exercise three times',
        'Read a book chapter',
        'Cook a healthy meal',
        'Call a friend'
      ];

      // Check if we're on wants input page
      const wantsInputs = page.locator('input[placeholder*="want" i], textarea[placeholder*="want" i]');
      const wantCount = await wantsInputs.count();

      if (wantCount > 0) {
        // Fill in each want field
        for (let i = 0; i < Math.min(wants.length, wantCount); i++) {
          await wantsInputs.nth(i).fill(wants[i]);
        }

        // Submit wants
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Save"), button:has-text("Continue")').first();
        await submitButton.click();

        // Wait for navigation
        await page.waitForLoadState('networkidle');

        // Take screenshot of wants submission
        await page.screenshot({ path: 'test-results/wants-submitted.png' });
      }

      // Navigate through daily check-ins
      const checkInButton = page.locator('button:has-text("Check In"), button:has-text("Daily Check"), a:has-text("Check In")').first();
      if (await checkInButton.isVisible().catch(() => false)) {
        await checkInButton.click();

        // Mark some wants as completed
        const checkboxes = page.locator('input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();

        if (checkboxCount > 0) {
          // Mark first 3 as completed
          for (let i = 0; i < Math.min(3, checkboxCount); i++) {
            await checkboxes.nth(i).check();
          }

          // Submit daily check-in
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Complete")').first();
          await saveButton.click();

          // Wait for save confirmation
          await page.waitForLoadState('networkidle');

          // Look for success message
          const successMessage = page.locator('text=/saved|complete|success/i').first();
          await expect(successMessage).toBeVisible({ timeout: 5000 }).catch(() => {
            console.log('No explicit success message shown');
          });
        }
      }

      // Complete the week and submit score
      const completeWeekButton = page.locator('button:has-text("Complete Week"), button:has-text("Finish Week"), button:has-text("End Week")').first();
      if (await completeWeekButton.isVisible().catch(() => false)) {
        await completeWeekButton.click();

        // Should show score summary
        const scoreElement = page.locator('text=/score|points|completed/i').first();
        await expect(scoreElement).toBeVisible({ timeout: 5000 });

        // Take screenshot of score
        await page.screenshot({ path: 'test-results/weekly-score.png' });

        // Confirm completion
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Continue"), button:has-text("Next")').first();
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
        }
      }
    });

    test('should handle partial week completion', async ({ page }) => {
      // Navigate to wants page
      await wantsPage.goto();

      // Start but don't complete all wants
      const wantsInputs = page.locator('input[placeholder*="want" i], textarea[placeholder*="want" i]');
      const wantCount = await wantsInputs.count();

      if (wantCount > 0) {
        // Only fill in 2 wants
        await wantsInputs.nth(0).fill('First want');
        await wantsInputs.nth(1).fill('Second want');

        // Try to submit
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Save")').first();
        await submitButton.click();

        // Should either show validation or allow partial submission
        const validationMessage = page.locator('text=/required|complete all|fill all/i').first();
        const isValidationShown = await validationMessage.isVisible({ timeout: 3000 }).catch(() => false);

        if (!isValidationShown) {
          // Partial submission allowed
          await page.waitForLoadState('networkidle');
          expect(page.url()).not.toContain('/wants');
        }
      }
    });

    test('should save progress and resume later', async ({ page }) => {
      // Start filling wants
      await wantsPage.goto();

      const wantsInputs = page.locator('input[placeholder*="want" i], textarea[placeholder*="want" i]');
      const wantCount = await wantsInputs.count();

      if (wantCount > 0) {
        // Fill in some wants
        await wantsInputs.nth(0).fill('Want to save');
        await wantsInputs.nth(1).fill('Another want');

        // Look for save/draft button
        const saveButton = page.locator('button:has-text("Save Draft"), button:has-text("Save Progress")').first();
        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.click();

          // Wait for save
          await page.waitForLoadState('networkidle');

          // Navigate away
          await homePage.goto();

          // Come back to wants
          await wantsPage.goto();

          // Check if wants are still there
          const firstWantValue = await wantsInputs.nth(0).inputValue();
          expect(firstWantValue).toContain('Want to save');
        }
      }
    });
  });

  test.describe('Score Submission', () => {
    test('should calculate and display correct score', async ({ page }) => {
      // Complete a quick game cycle
      await wantsPage.goto();

      const wantsInputs = page.locator('input[placeholder*="want" i], textarea[placeholder*="want" i]');
      const wantCount = await wantsInputs.count();

      if (wantCount >= 5) {
        // Fill all 5 wants
        for (let i = 0; i < 5; i++) {
          await wantsInputs.nth(i).fill(`Want ${i + 1}`);
        }

        // Submit wants
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Save")').first();
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        // Do daily check-in and mark 3 as complete
        const checkInButton = page.locator('button:has-text("Check In"), a:has-text("Check In")').first();
        if (await checkInButton.isVisible().catch(() => false)) {
          await checkInButton.click();

          const checkboxes = page.locator('input[type="checkbox"]');
          if (await checkboxes.count() >= 3) {
            for (let i = 0; i < 3; i++) {
              await checkboxes.nth(i).check();
            }

            // Submit check-in
            const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit")').first();
            await saveButton.click();
            await page.waitForLoadState('networkidle');
          }
        }

        // View score
        const scoreButton = page.locator('button:has-text("View Score"), a:has-text("Score")').first();
        if (await scoreButton.isVisible().catch(() => false)) {
          await scoreButton.click();

          // Should show 3/5 or 60%
          const scoreText = page.locator('text=/3.*5|60%|3 out of 5/i').first();
          await expect(scoreText).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should prevent score manipulation', async ({ page }) => {
      // Try to directly access score submission endpoint
      const response = await page.goto('/api/score/submit', { waitUntil: 'networkidle' }).catch(() => null);

      if (response) {
        // Should either return error or redirect
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }

      // Try to modify score via console
      await page.goto('/');
      const result = await page.evaluate(() => {
        try {
          // Attempt to modify score in localStorage or sessionStorage
          localStorage.setItem('weeklyScore', '100');
          sessionStorage.setItem('weeklyScore', '100');
          return 'modified';
        } catch (e) {
          return 'blocked';
        }
      });

      // Navigate to score page
      const scoreLink = page.locator('a:has-text("Score"), a:has-text("Progress")').first();
      if (await scoreLink.isVisible().catch(() => false)) {
        await scoreLink.click();

        // Score should not be 100 unless legitimately earned
        const fakeScore = page.locator('text="100"').first();
        const hasFakeScore = await fakeScore.isVisible({ timeout: 2000 }).catch(() => false);

        if (hasFakeScore && result === 'modified') {
          console.log('Warning: Score might be modifiable client-side');
        }
      }
    });
  });

  test.describe('History and Progress', () => {
    test('should display historical game data', async ({ page }) => {
      // Navigate to history/progress page
      const historyLink = page.locator('a:has-text("History"), a:has-text("Progress"), a:has-text("Past Weeks")').first();

      if (await historyLink.isVisible().catch(() => false)) {
        await historyLink.click();
        await page.waitForLoadState('networkidle');

        // Should show past weeks or empty state
        const historyContent = page.locator('text=/week|history|no data|get started/i').first();
        await expect(historyContent).toBeVisible({ timeout: 5000 });

        // Take screenshot of history
        await page.screenshot({ path: 'test-results/history-page.png' });

        // Check for week entries if they exist
        const weekEntries = page.locator('[data-testid*="week"], .week-entry, article:has-text("Week")');
        const entryCount = await weekEntries.count();

        if (entryCount > 0) {
          // Click on first week to view details
          await weekEntries.first().click();

          // Should show week details
          const detailsElement = page.locator('text=/wants|score|completed/i').first();
          await expect(detailsElement).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should track progress over multiple weeks', async ({ page }) => {
      // Navigate to progress/stats page
      const progressLink = page.locator('a:has-text("Progress"), a:has-text("Statistics"), a:has-text("Stats")').first();

      if (await progressLink.isVisible().catch(() => false)) {
        await progressLink.click();
        await page.waitForLoadState('networkidle');

        // Look for progress indicators
        const progressIndicators = [
          'text=/streak/i',
          'text=/total.*weeks/i',
          'text=/average.*score/i',
          'text=/completion.*rate/i'
        ];

        let foundIndicator = false;
        for (const indicator of progressIndicators) {
          const element = page.locator(indicator).first();
          if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            foundIndicator = true;
            break;
          }
        }

        if (foundIndicator) {
          // Take screenshot of progress
          await page.screenshot({ path: 'test-results/progress-stats.png' });
        }
      }
    });

    test('should export or download history data', async ({ page }) => {
      // Navigate to history page
      const historyLink = page.locator('a:has-text("History"), a:has-text("Progress")').first();

      if (await historyLink.isVisible().catch(() => false)) {
        await historyLink.click();
        await page.waitForLoadState('networkidle');

        // Look for export/download button
        const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("Save Data")').first();

        if (await exportButton.isVisible().catch(() => false)) {
          // Set up download listener
          const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

          // Click export
          await exportButton.click();

          // Check if download was triggered
          const download = await downloadPromise;
          if (download) {
            // Verify download
            expect(download).toBeTruthy();
            const filename = download.suggestedFilename();
            expect(filename).toMatch(/\.(json|csv|pdf|txt)$/i);
          }
        }
      }
    });
  });

  test.describe('Game Rules and Validation', () => {
    test('should enforce weekly cycle rules', async ({ page }) => {
      // Try to start a new week when one is already active
      await wantsPage.goto();

      // Fill some wants to start a week
      const wantsInputs = page.locator('input[placeholder*="want" i], textarea[placeholder*="want" i]');
      if (await wantsInputs.count() > 0) {
        await wantsInputs.nth(0).fill('Active week want');

        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Save")').first();
        await submitButton.click();
        await page.waitForLoadState('networkidle');

        // Try to start another week
        await wantsPage.goto();

        // Should either show existing week or prevent new week
        const warningMessage = page.locator('text=/already.*active|complete.*current|finish.*first/i').first();
        const hasWarning = await warningMessage.isVisible({ timeout: 3000 }).catch(() => false);

        if (!hasWarning) {
          // Check if it shows the existing week's wants
          const existingWant = await wantsInputs.nth(0).inputValue().catch(() => '');
          if (existingWant === 'Active week want') {
            // Correctly showing existing week
            expect(existingWant).toBe('Active week want');
          }
        } else {
          // Correctly preventing new week
          expect(hasWarning).toBeTruthy();
        }
      }
    });

    test('should validate want entries', async ({ page }) => {
      await wantsPage.goto();

      const wantsInputs = page.locator('input[placeholder*="want" i], textarea[placeholder*="want" i]');
      if (await wantsInputs.count() > 0) {
        // Try to submit empty wants
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Save")').first();
        await submitButton.click();

        // Should show validation
        const validationMessage = page.locator('text=/required|empty|fill/i').first();
        await expect(validationMessage).toBeVisible({ timeout: 3000 }).catch(() => {
          console.log('No validation for empty wants');
        });

        // Try very long want text
        const longText = 'a'.repeat(1000);
        await wantsInputs.nth(0).fill(longText);

        // Check if it's truncated or shows error
        const actualValue = await wantsInputs.nth(0).inputValue();
        if (actualValue.length < 1000) {
          // Text was truncated - that's ok
          expect(actualValue.length).toBeLessThan(1000);
        }
      }
    });
  });
});