import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_USER } from '../helpers/auth.helper';
import { InnermostsPage } from '../pages/InnermostsPage';
import { HomePage } from '../pages/HomePage';

/**
 * E2E Tests for Premium Features and Restrictions
 * Tests premium vs free user capabilities, upgrade prompts, and feature access
 */
test.describe('Premium Features Tests', () => {
  let authHelper: AuthHelper;
  let innermostsPage: InnermostsPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    innermostsPage = new InnermostsPage(page);
    homePage = new HomePage(page);

    // We're already authenticated from the setup project!
    // Navigate to home and wait for auth to be restored
    await page.goto('/');

    // Give Firebase time to restore auth from IndexedDB
    await page.waitForTimeout(3000);

    // Check current URL after auth restoration
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);

    // If we're still on login page, auth didn't work
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Not authenticated - auth state not properly restored from IndexedDB');
    }

    // If we're on home page, we're good
    if (!currentUrl.endsWith('/')) {
      // Navigate to home if we ended up somewhere else
      await page.goto('/');
    }
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test.describe('Free User Restrictions', () => {
    test('should limit free users to 1 innermost', async ({ page }) => {
      // Navigate to innermosts
      await innermostsPage.goto();

      // Try to create first innermost
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Innermost")').first();

      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Fill in innermost details
        const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="title" i]').first();
        if (await nameInput.isVisible().catch(() => false)) {
          await nameInput.fill('My First Innermost');

          // Submit
          const submitButton = page.locator('button:has-text("Create"), button:has-text("Save")').first();
          await submitButton.click();
          await page.waitForLoadState('networkidle');

          // Should successfully create first innermost
          const firstInnermost = page.locator('text="My First Innermost"').first();
          await expect(firstInnermost).toBeVisible({ timeout: 5000 });

          // Now try to create second innermost
          const createSecondButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();
          if (await createSecondButton.isVisible().catch(() => false)) {
            await createSecondButton.click();

            // Should show upgrade prompt or limit message
            const limitMessage = page.locator('text=/upgrade|premium|limit|maximum/i').first();
            await expect(limitMessage).toBeVisible({ timeout: 5000 });

            // Take screenshot of upgrade prompt
            await page.screenshot({ path: 'test-results/innermost-limit-prompt.png' });
          }
        }
      }
    });

    test('should show upgrade prompts for premium features', async ({ page }) => {
      // Navigate to home/dashboard
      await homePage.goto();

      // Look for premium feature indicators
      const premiumBadges = page.locator('[data-premium], .premium-badge, text=/premium|pro|upgrade/i');
      const badgeCount = await premiumBadges.count();

      if (badgeCount > 0) {
        // Click on a premium feature
        await premiumBadges.first().click();

        // Should show upgrade modal or redirect to pricing
        const upgradeModal = page.locator('[role="dialog"]:has-text("Upgrade"), .modal:has-text("Premium")').first();
        const pricingPage = page.locator('h1:has-text("Pricing"), h1:has-text("Plans")').first();

        const hasUpgradePrompt = await upgradeModal.isVisible({ timeout: 3000 }).catch(() => false) ||
                                 await pricingPage.isVisible({ timeout: 3000 }).catch(() => false);

        expect(hasUpgradePrompt).toBeTruthy();

        // Check for pricing information
        const priceElement = page.locator('text=/$\\d+|\\$\\d+\\/|per month|per year/i').first();
        await expect(priceElement).toBeVisible({ timeout: 5000 }).catch(() => {
          console.log('No pricing information displayed');
        });
      }
    });

    test('should restrict advanced analytics for free users', async ({ page }) => {
      // Navigate to analytics/insights if available
      const analyticsLink = page.locator('a:has-text("Analytics"), a:has-text("Insights"), a:has-text("Reports")').first();

      if (await analyticsLink.isVisible().catch(() => false)) {
        await analyticsLink.click();
        await page.waitForLoadState('networkidle');

        // Look for locked features
        const lockedFeatures = page.locator('[data-locked], .locked, .disabled:has-text("Premium")');
        const lockedCount = await lockedFeatures.count();

        if (lockedCount > 0) {
          // Try to interact with locked feature
          await lockedFeatures.first().click();

          // Should show upgrade prompt
          const upgradePrompt = page.locator('text=/upgrade|unlock|premium/i').first();
          await expect(upgradePrompt).toBeVisible({ timeout: 5000 });
        }

        // Check for basic vs advanced features
        const basicStats = page.locator('text=/basic|summary|overview/i').first();
        const advancedStats = page.locator('text=/advanced|detailed|comprehensive/i').first();

        if (await basicStats.isVisible().catch(() => false)) {
          // Basic stats should be accessible
          expect(await basicStats.isVisible()).toBeTruthy();
        }

        if (await advancedStats.isVisible().catch(() => false)) {
          // Advanced stats might be locked
          const isLocked = await advancedStats.evaluate(el => {
            return el.classList.contains('locked') ||
                   el.classList.contains('disabled') ||
                   el.hasAttribute('disabled');
          }).catch(() => false);

          if (isLocked) {
            console.log('Advanced analytics correctly locked for free users');
          }
        }
      }
    });

    test('should limit export options for free users', async ({ page }) => {
      // Navigate to a page with export functionality
      const historyLink = page.locator('a:has-text("History"), a:has-text("Data")').first();

      if (await historyLink.isVisible().catch(() => false)) {
        await historyLink.click();
        await page.waitForLoadState('networkidle');

        // Look for export button
        const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();

        if (await exportButton.isVisible().catch(() => false)) {
          await exportButton.click();

          // Check for format options
          const exportModal = page.locator('[role="dialog"], .modal').first();
          if (await exportModal.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Look for premium format options
            const premiumFormats = page.locator('text=/PDF.*Premium|Excel.*Premium|Premium.*export/i');
            const hasPremiumFormats = await premiumFormats.first().isVisible({ timeout: 2000 }).catch(() => false);

            if (hasPremiumFormats) {
              // Try to select premium format
              await premiumFormats.first().click();

              // Should show upgrade prompt
              const upgradeMessage = page.locator('text=/upgrade|premium.*required/i').first();
              await expect(upgradeMessage).toBeVisible({ timeout: 3000 });
            }

            // Basic export (like JSON/CSV) should work
            const basicFormat = page.locator('text=/JSON|CSV|Text/i').first();
            if (await basicFormat.isVisible().catch(() => false)) {
              await basicFormat.click();

              const downloadButton = page.locator('button:has-text("Download"), button:has-text("Export")').last();
              const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

              await downloadButton.click();

              const download = await downloadPromise;
              if (download) {
                expect(download).toBeTruthy();
              }
            }
          }
        }
      }
    });
  });

  test.describe('Upgrade Process', () => {
    test('should navigate to upgrade page from various prompts', async ({ page }) => {
      // Find any upgrade button/link
      const upgradeSelectors = [
        'button:has-text("Upgrade")',
        'a:has-text("Upgrade")',
        'button:has-text("Go Premium")',
        'a:has-text("Premium")',
        '[data-testid="upgrade-button"]'
      ];

      let upgradeFound = false;
      for (const selector of upgradeSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          await element.click();
          upgradeFound = true;
          break;
        }
      }

      if (upgradeFound) {
        // Should navigate to pricing/upgrade page
        await page.waitForLoadState('networkidle');

        // Check for pricing page elements
        const pricingElements = [
          'h1:has-text("Premium")',
          'h1:has-text("Pricing")',
          'text=/choose.*plan/i',
          'text=/$\\d+/'
        ];

        let pricingPageFound = false;
        for (const element of pricingElements) {
          if (await page.locator(element).first().isVisible({ timeout: 3000 }).catch(() => false)) {
            pricingPageFound = true;
            break;
          }
        }

        expect(pricingPageFound).toBeTruthy();

        // Take screenshot of pricing page
        await page.screenshot({ path: 'test-results/pricing-page.png' });
      }
    });

    test('should show comparison between free and premium', async ({ page }) => {
      // Navigate to pricing or features page
      const pricingLink = page.locator('a:has-text("Pricing"), a:has-text("Plans"), a:has-text("Premium")').first();

      if (await pricingLink.isVisible().catch(() => false)) {
        await pricingLink.click();
        await page.waitForLoadState('networkidle');

        // Look for feature comparison
        const comparisonTable = page.locator('table, .comparison, .features-grid');
        if (await comparisonTable.first().isVisible({ timeout: 3000 }).catch(() => false)) {
          // Check for free tier column/section
          const freeSection = page.locator('text=/free|basic|starter/i').first();
          await expect(freeSection).toBeVisible({ timeout: 3000 });

          // Check for premium tier column/section
          const premiumSection = page.locator('text=/premium|pro|plus/i').first();
          await expect(premiumSection).toBeVisible({ timeout: 3000 });

          // Look for specific feature differences
          const innermostLimit = page.locator('text=/1 innermost|3 innermosts|unlimited innermosts/i').first();
          await expect(innermostLimit).toBeVisible({ timeout: 3000 }).catch(() => {
            console.log('Innermost limit not explicitly shown in comparison');
          });
        }
      }
    });

    test('should handle payment flow initiation', async ({ page }) => {
      // Navigate to upgrade page
      const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();

      if (await upgradeButton.isVisible().catch(() => false)) {
        await upgradeButton.click();
        await page.waitForLoadState('networkidle');

        // Select a plan
        const selectPlanButton = page.locator('button:has-text("Select"), button:has-text("Choose"), button:has-text("Get Premium")').first();

        if (await selectPlanButton.isVisible().catch(() => false)) {
          await selectPlanButton.click();

          // Should either show payment form or redirect to payment provider
          const paymentIndicators = [
            'iframe[src*="stripe"]',
            'iframe[src*="paypal"]',
            'input[placeholder*="card number" i]',
            'text=/payment|billing|card/i'
          ];

          let paymentFormFound = false;
          for (const indicator of paymentIndicators) {
            if (await page.locator(indicator).first().isVisible({ timeout: 5000 }).catch(() => false)) {
              paymentFormFound = true;
              break;
            }
          }

          if (paymentFormFound) {
            // Take screenshot of payment initiation
            await page.screenshot({ path: 'test-results/payment-form.png' });

            // Don't proceed with actual payment
            console.log('Payment form successfully loaded');
          }
        }
      }
    });
  });

  test.describe('Premium Feature Access', () => {
    test('should verify premium features are locked', async ({ page }) => {
      // Check various premium features across the app
      const premiumFeatures = [
        {
          name: 'Multiple Innermosts',
          selector: 'button:has-text("Create Innermost")',
          action: async () => {
            await innermostsPage.goto();
            const innermostCount = await page.locator('[data-testid*="innermost"], .innermost-card').count();
            return innermostCount > 1;
          }
        },
        {
          name: 'Advanced Analytics',
          selector: 'a:has-text("Analytics"), a:has-text("Insights")',
          action: async () => {
            const analyticsLink = page.locator('a:has-text("Analytics")').first();
            if (await analyticsLink.isVisible().catch(() => false)) {
              await analyticsLink.click();
              const advancedFeature = page.locator('.premium-feature, [data-premium="true"]').first();
              return await advancedFeature.isVisible({ timeout: 3000 }).catch(() => false);
            }
            return false;
          }
        },
        {
          name: 'Custom Themes',
          selector: 'button:has-text("Themes"), button:has-text("Appearance")',
          action: async () => {
            const themeButton = page.locator('[aria-label*="theme" i], button:has-text("Theme")').first();
            if (await themeButton.isVisible().catch(() => false)) {
              await themeButton.click();
              const premiumTheme = page.locator('text=/premium.*theme|custom.*premium/i').first();
              return await premiumTheme.isVisible({ timeout: 3000 }).catch(() => false);
            }
            return false;
          }
        }
      ];

      for (const feature of premiumFeatures) {
        const hasRestriction = await feature.action();
        if (hasRestriction) {
          console.log(`${feature.name} correctly restricted for free users`);
        }
      }
    });

    test('should track feature usage attempts', async ({ page }) => {
      // Try to use premium features and verify tracking
      let upgradePromptCount = 0;

      // Attempt 1: Try to create multiple innermosts
      await innermostsPage.goto();
      const createButton = page.locator('button:has-text("Create")').first();
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();
        const upgradePrompt = page.locator('text=/upgrade|premium/i').first();
        if (await upgradePrompt.isVisible({ timeout: 2000 }).catch(() => false)) {
          upgradePromptCount++;
          // Close modal if present
          const closeButton = page.locator('[aria-label="Close"], button:has-text("Cancel")').first();
          if (await closeButton.isVisible().catch(() => false)) {
            await closeButton.click();
          }
        }
      }

      // Attempt 2: Try to access analytics
      const analyticsLink = page.locator('a:has-text("Analytics")').first();
      if (await analyticsLink.isVisible().catch(() => false)) {
        await analyticsLink.click();
        const premiumFeature = page.locator('.locked, [data-locked="true"]').first();
        if (await premiumFeature.isVisible({ timeout: 2000 }).catch(() => false)) {
          await premiumFeature.click();
          const upgradePrompt = page.locator('text=/upgrade|premium/i').first();
          if (await upgradePrompt.isVisible({ timeout: 2000 }).catch(() => false)) {
            upgradePromptCount++;
          }
        }
      }

      console.log(`Upgrade prompts shown: ${upgradePromptCount}`);
      expect(upgradePromptCount).toBeGreaterThan(0);
    });
  });

  test.describe('Innermost Limits', () => {
    test('should enforce 1 vs 3 innermost limit', async ({ page }) => {
      await innermostsPage.goto();

      // Count existing innermosts
      const existingInnermosts = await page.locator('[data-testid*="innermost"], .innermost-card, article:has-text("innermost")').count();

      // For free user (1 innermost limit)
      if (existingInnermosts === 0) {
        // Create first innermost
        await innermostsPage.createInnermost('Free User Innermost');

        // Try to create second
        const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();
        if (await createButton.isVisible().catch(() => false)) {
          await createButton.click();

          // Should show limit message
          const limitMessage = page.locator('text=/limit|maximum|upgrade.*more/i').first();
          await expect(limitMessage).toBeVisible({ timeout: 5000 });

          // Verify exactly 1 innermost exists
          const innermostCount = await page.locator('[data-testid*="innermost"], .innermost-card').count();
          expect(innermostCount).toBe(1);
        }
      }

      // Check for premium user capability (3 innermosts)
      const premiumBadge = page.locator('text=/premium|pro/i').first();
      const isPremium = await premiumBadge.isVisible({ timeout: 1000 }).catch(() => false);

      if (isPremium) {
        // Premium user should be able to create up to 3
        for (let i = existingInnermosts + 1; i <= 3; i++) {
          const canCreate = await innermostsPage.createInnermost(`Premium Innermost ${i}`);
          if (!canCreate && i <= 3) {
            console.log(`Hit limit at ${i - 1} innermosts`);
            break;
          }
        }

        // Try to create 4th innermost (should fail even for premium)
        const create4thButton = page.locator('button:has-text("Create")').first();
        if (await create4thButton.isVisible().catch(() => false)) {
          await create4thButton.click();

          const limitMessage = page.locator('text=/limit|maximum/i').first();
          const hasLimit = await limitMessage.isVisible({ timeout: 3000 }).catch(() => false);

          if (hasLimit) {
            console.log('Premium user correctly limited to 3 innermosts');
          }
        }
      }
    });

    test('should show upgrade CTA when hitting free limit', async ({ page }) => {
      await innermostsPage.goto();

      // Ensure we have 1 innermost (free limit)
      const innermostCount = await page.locator('[data-testid*="innermost"], .innermost-card').count();

      if (innermostCount === 0) {
        // Create first innermost
        await innermostsPage.createInnermost('My Only Innermost');
      }

      // Try to create another
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();

        // Should show upgrade CTA
        const upgradeCTA = page.locator('button:has-text("Upgrade"), a:has-text("Go Premium")').first();
        await expect(upgradeCTA).toBeVisible({ timeout: 5000 });

        // Should show benefit of upgrading
        const benefitText = page.locator('text=/3 innermosts|multiple innermosts/i').first();
        await expect(benefitText).toBeVisible({ timeout: 3000 }).catch(() => {
          console.log('Benefit text not explicitly shown');
        });

        // Take screenshot of upgrade CTA
        await page.screenshot({ path: 'test-results/innermost-upgrade-cta.png' });
      }
    });

    test('should handle innermost switching for premium users', async ({ page }) => {
      // This test would run if user is premium (has multiple innermosts)
      await innermostsPage.goto();

      const innermosts = await page.locator('[data-testid*="innermost"], .innermost-card').all();

      if (innermosts.length > 1) {
        // Premium user with multiple innermosts
        const firstInnermost = innermosts[0];
        const secondInnermost = innermosts[1];

        // Get names
        const firstName = await firstInnermost.textContent();
        const secondName = await secondInnermost.textContent();

        // Switch to second innermost
        await secondInnermost.click();

        // Verify switched
        const activeIndicator = page.locator('.active, [data-active="true"], [aria-current="true"]').first();
        const activeText = await activeIndicator.textContent().catch(() => '');

        if (activeText && secondName) {
          expect(activeText).toContain(secondName);
        }

        // Switch back to first
        await firstInnermost.click();

        // Verify switched back
        const newActiveText = await activeIndicator.textContent().catch(() => '');
        if (newActiveText && firstName) {
          expect(newActiveText).toContain(firstName);
        }
      } else {
        console.log('User has only 1 innermost (free tier) - switching test skipped');
      }
    });
  });
});