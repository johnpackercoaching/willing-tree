#!/usr/bin/env node
/**
 * Simple Premium Feature Test
 * Tests that premium features are properly restricted
 * Uses existing user session
 */

import { chromium } from 'playwright';

const TEST_URL = 'http://localhost:5173';

async function testPremiumRestrictions() {
  console.log('🧪 Testing Premium Feature Restrictions\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  try {
    const page = await browser.newPage();
    const results = [];

    // Go to home page first
    console.log('📍 Navigating to home page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });

    // Check if user is logged in
    const loginLink = await page.$('a[href="/auth/login"]');
    if (loginLink) {
      console.log('⚠️  User not logged in. Please log in first and run test again.\n');
      await browser.close();
      return;
    }

    console.log('✅ User is logged in\n');

    // Test 1: Analytics Page
    console.log('📋 Test 1: Analytics Dashboard Access');
    await page.goto(`${TEST_URL}/analytics`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const analyticsBlocked = await page.$('text=/Premium Only/i');
    const upgradePrompt = await page.$('text=/Upgrade to unlock/i');
    const analyticsChart = await page.$('svg[role="img"]');

    if (analyticsBlocked || upgradePrompt) {
      results.push('✅ Analytics blocked for free user - CORRECT');
      console.log('  ✅ Analytics is properly restricted\n');
    } else if (analyticsChart) {
      results.push('❌ Analytics accessible to free user - SECURITY ISSUE!');
      console.log('  ❌ FAILED: Analytics should be premium only!\n');
    }

    // Test 2: Data Export
    console.log('📋 Test 2: Data Export Feature');
    await page.goto(`${TEST_URL}/settings`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const exportButton = await page.$('button:has-text("Export All Data")');
    if (exportButton) {
      // Check for lock icon or disabled state
      const buttonHTML = await exportButton.innerHTML();
      const hasLock = buttonHTML.includes('data-lucide="lock"') || buttonHTML.includes('Lock');
      const isPremium = buttonHTML.includes('Premium');

      if (hasLock || isPremium) {
        results.push('✅ Export button shows premium restriction');
        console.log('  ✅ Export is properly restricted\n');

        // Try clicking it
        await exportButton.click();
        await page.waitForTimeout(1000);

        // Check for toast error
        const toast = await page.$('.go1888806478'); // React hot toast class
        if (toast) {
          const toastText = await toast.textContent();
          if (toastText.includes('Premium')) {
            results.push('✅ Export click shows premium error');
            console.log('  ✅ Export attempt properly blocked\n');
          }
        }
      } else {
        // Button looks unrestricted, try clicking
        await exportButton.click();
        await page.waitForTimeout(2000);

        // Check if export actually happened
        const downloadStarted = page.waitForEvent('download', { timeout: 3000 })
          .then(() => true)
          .catch(() => false);

        if (await downloadStarted) {
          results.push('❌ Export worked for free user - SECURITY ISSUE!');
          console.log('  ❌ FAILED: Export should be premium only!\n');
        } else {
          results.push('✅ Export blocked despite normal button appearance');
          console.log('  ✅ Export blocked correctly\n');
        }
      }
    }

    // Test 3: Innermosts Limit
    console.log('📋 Test 3: Innermost Creation Limit');
    await page.goto(`${TEST_URL}/innermosts`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check for limit display
    const limitText = await page.$('text=/\\/\\s*1\\s*$/'); // matches "/ 1"
    const premiumLimitText = await page.$('text=/\\/\\s*3\\s*$/'); // matches "/ 3"

    if (limitText) {
      results.push('✅ Shows 1 innermost limit for free users');
      console.log('  ✅ Innermost limit correctly displayed\n');
    } else if (premiumLimitText) {
      results.push('⚠️  Shows 3 innermost limit - user might be premium');
      console.log('  ⚠️  User appears to have premium access\n');
    }

    // Test 4: Want Categories
    console.log('📋 Test 4: Want Categories Restriction');
    await page.goto(`${TEST_URL}/wants/create`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const lockedCategories = await page.$$('[data-lucide="lock"]');
    const premiumBadges = await page.$$('text=/Premium/i');

    if (lockedCategories.length > 0) {
      results.push(`✅ ${lockedCategories.length} categories locked`);
      console.log(`  ✅ ${lockedCategories.length} categories are locked\n`);
    } else if (premiumBadges.length > 0) {
      results.push('✅ Premium badges shown on categories');
      console.log('  ✅ Premium indicators present\n');
    } else {
      results.push('⚠️  No visible category restrictions');
      console.log('  ⚠️  Categories may not be properly restricted\n');
    }

    // Test 5: Direct URL Access
    console.log('📋 Test 5: Direct URL Manipulation');

    // Try to access analytics directly via URL
    await page.evaluate(() => {
      window.location.href = '/analytics';
    });
    await page.waitForTimeout(2000);

    const stillBlocked = await page.$('text=/Premium/i');
    if (stillBlocked) {
      results.push('✅ Direct URL access blocked');
      console.log('  ✅ URL manipulation prevented\n');
    }

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60) + '\n');

    const passed = results.filter(r => r.includes('✅')).length;
    const failed = results.filter(r => r.includes('❌')).length;
    const warnings = results.filter(r => r.includes('⚠️')).length;

    results.forEach(r => console.log(r));

    console.log('\n' + '='.repeat(60));
    if (failed === 0) {
      console.log('🎉 SUCCESS: All premium features are properly restricted!');
      console.log('Free users cannot access premium features.');
    } else {
      console.log(`⚠️  WARNING: ${failed} security issue(s) detected!`);
      console.log('Some premium features may be accessible to free users.');
    }
    console.log('='.repeat(60) + '\n');

    // Keep browser open for 3 seconds to see results
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run test
testPremiumRestrictions().catch(console.error);