#!/usr/bin/env node
/**
 * Premium Feature Access Control Test
 * Verifies that free users cannot access premium features
 * and that premium users have proper access
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_URL = process.env.TEST_URL || 'http://localhost:5173';
const FREE_USER_EMAIL = 'free-test@example.com';
const FREE_USER_PASSWORD = 'TestPassword123!';
const PREMIUM_USER_EMAIL = 'premium-test@example.com';
const PREMIUM_USER_PASSWORD = 'TestPassword123!';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class PremiumAccessTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  async init() {
    this.browser = await chromium.launch({
      headless: false, // Set to true for CI
      slowMo: 100 // Slow down for visibility
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();

    // Monitor console for errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('404')) {
          this.results.warnings.push(`Console error: ${text.substring(0, 100)}`);
        }
      }
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login(email, password) {
    log(`\n📝 Logging in as ${email}...`, 'cyan');

    await this.page.goto(`${TEST_URL}/auth/login`, { waitUntil: 'networkidle' });

    // Fill login form
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);

    // Submit form
    await this.page.click('button[type="submit"]');

    // Wait for navigation or error
    try {
      await this.page.waitForURL((url) => !url.includes('/auth/login'), {
        timeout: 5000
      });
      log('✅ Login successful', 'green');
      return true;
    } catch {
      // Check for error message
      const errorElement = await this.page.$('.text-red-600');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        log(`❌ Login failed: ${errorText}`, 'red');
      } else {
        log('❌ Login failed: Unknown error', 'red');
      }
      return false;
    }
  }

  async testFreeUserRestrictions() {
    log('\n🔒 Testing FREE User Restrictions...', 'magenta');
    log('=' .repeat(50), 'cyan');

    // Test 1: Multiple Innermosts Creation
    log('\n📋 Test 1: Innermost Creation Limit', 'blue');
    await this.page.goto(`${TEST_URL}/innermosts`, { waitUntil: 'networkidle' });

    // Check innermost count display
    const countText = await this.page.textContent('text=/\\d+\\s*\\/\\s*\\d+/');
    if (countText && countText.includes('/ 1')) {
      this.results.passed.push('✅ Free user sees 1 innermost limit');
    } else {
      this.results.failed.push('❌ Free user limit not displayed correctly');
    }

    // Try to create second innermost (should be blocked)
    const plantButton = await this.page.$('button:has-text("Plant New Tree")');
    if (!plantButton || await plantButton.isDisabled()) {
      this.results.passed.push('✅ Create button disabled when at limit');
    } else {
      // Click and check for upgrade prompt
      await plantButton.click();
      await this.page.waitForTimeout(1000);

      const upgradePrompt = await this.page.$('text=/Upgrade to Premium/i');
      if (upgradePrompt) {
        this.results.passed.push('✅ Upgrade prompt shown when trying to exceed limit');
      } else {
        this.results.failed.push('❌ No upgrade prompt when exceeding innermost limit');
      }
    }

    // Test 2: Analytics Dashboard Access
    log('\n📋 Test 2: Analytics Dashboard Access', 'blue');
    await this.page.goto(`${TEST_URL}/analytics`, { waitUntil: 'networkidle' });

    // Should see upgrade prompt instead of analytics
    const analyticsBlocked = await this.page.$('text=/Analytics Dashboard is Premium Only/i');
    const analyticsUpgrade = await this.page.$('text=/Upgrade to unlock/i');

    if (analyticsBlocked || analyticsUpgrade) {
      this.results.passed.push('✅ Analytics dashboard blocked for free users');
    } else {
      // Check if any analytics data is visible
      const chartElements = await this.page.$$('svg[role="img"]');
      if (chartElements.length === 0) {
        this.results.passed.push('✅ No analytics data visible to free users');
      } else {
        this.results.failed.push('❌ Analytics data visible to free users!');
      }
    }

    // Test 3: Data Export Feature
    log('\n📋 Test 3: Data Export Feature', 'blue');
    await this.page.goto(`${TEST_URL}/settings`, { waitUntil: 'networkidle' });

    // Find export button
    const exportButton = await this.page.$('button:has-text("Export All Data")');
    if (exportButton) {
      const isDisabled = await exportButton.isDisabled();
      const hasLockIcon = await this.page.$('button:has-text("Export All Data") svg');

      if (isDisabled || hasLockIcon) {
        this.results.passed.push('✅ Export button disabled for free users');

        // Try clicking anyway
        await exportButton.click({ force: true });
        await this.page.waitForTimeout(1000);

        // Check for error toast or upgrade prompt
        const toastError = await this.page.$('text=/premium feature/i');
        if (toastError) {
          this.results.passed.push('✅ Export attempt shows premium requirement');
        }
      } else {
        this.results.failed.push('❌ Export button not properly restricted');
      }
    }

    // Test 4: Custom Want Categories
    log('\n📋 Test 4: Custom Want Categories', 'blue');
    await this.page.goto(`${TEST_URL}/wants/create`, { waitUntil: 'networkidle' });

    // Count available categories
    const categoryCards = await this.page.$$('.border.rounded-lg');
    const lockedCategories = await this.page.$$('svg[data-lucide="lock"]');

    if (lockedCategories.length > 0) {
      this.results.passed.push(`✅ ${lockedCategories.length} categories locked for free users`);
    } else {
      this.results.failed.push('❌ No locked categories visible');
    }

    // Try clicking a locked category
    const lockedCard = await this.page.$(':has(svg[data-lucide="lock"])');
    if (lockedCard) {
      await lockedCard.click();
      await this.page.waitForTimeout(1000);

      const upgradeModal = await this.page.$('text=/Custom Categories/i');
      if (upgradeModal) {
        this.results.passed.push('✅ Clicking locked category shows upgrade prompt');
      }
    }

    // Test 5: Historical Score Access
    log('\n📋 Test 5: Historical Score Access', 'blue');
    // This would need an existing innermost with scores
    // Simulating by trying to access a past week URL directly
    const pastWeekUrl = `${TEST_URL}/innermosts/test-id/scoring/week/1`;
    await this.page.goto(pastWeekUrl, { waitUntil: 'networkidle' });

    const historyBlocked = await this.page.$('text=/Extended History is Premium Only/i');
    if (historyBlocked) {
      this.results.passed.push('✅ Historical scores blocked for free users');
    }

    // Test 6: Direct URL Access Attempts
    log('\n📋 Test 6: URL Manipulation Protection', 'blue');
    const protectedUrls = [
      '/analytics',
      '/premium-features',
      '/export'
    ];

    for (const url of protectedUrls) {
      await this.page.goto(`${TEST_URL}${url}`, { waitUntil: 'networkidle' });
      await this.page.waitForTimeout(500);

      // Check if redirected or blocked
      const currentUrl = this.page.url();
      const hasUpgradePrompt = await this.page.$('text=/Premium/i');

      if (!currentUrl.includes(url) || hasUpgradePrompt) {
        this.results.passed.push(`✅ Direct access to ${url} blocked`);
      } else {
        this.results.failed.push(`❌ Direct access to ${url} not blocked!`);
      }
    }
  }

  async testPremiumUserAccess() {
    log('\n🌟 Testing PREMIUM User Access...', 'magenta');
    log('=' .repeat(50), 'cyan');

    // Test 1: Multiple Innermosts
    log('\n📋 Test 1: Can Create Multiple Innermosts', 'blue');
    await this.page.goto(`${TEST_URL}/innermosts`, { waitUntil: 'networkidle' });

    const premiumCount = await this.page.textContent('text=/\\d+\\s*\\/\\s*3/');
    if (premiumCount) {
      this.results.passed.push('✅ Premium user sees 3 innermost limit');
    }

    // Test 2: Analytics Access
    log('\n📋 Test 2: Analytics Dashboard Access', 'blue');
    await this.page.goto(`${TEST_URL}/analytics`, { waitUntil: 'networkidle' });

    const analyticsContent = await this.page.$('text=/Relationship Analytics/i');
    const charts = await this.page.$$('svg[role="img"]');

    if (analyticsContent || charts.length > 0) {
      this.results.passed.push('✅ Premium user can access analytics');
    } else {
      this.results.failed.push('❌ Premium user cannot access analytics');
    }

    // Test 3: Export Feature
    log('\n📋 Test 3: Data Export Access', 'blue');
    await this.page.goto(`${TEST_URL}/settings`, { waitUntil: 'networkidle' });

    const exportBtn = await this.page.$('button:has-text("Export All Data")');
    if (exportBtn) {
      const isEnabled = await exportBtn.isEnabled();
      if (isEnabled) {
        this.results.passed.push('✅ Export enabled for premium users');
      } else {
        this.results.failed.push('❌ Export disabled for premium users');
      }
    }

    // Test 4: All Categories Available
    log('\n📋 Test 4: All Want Categories Available', 'blue');
    await this.page.goto(`${TEST_URL}/wants/create`, { waitUntil: 'networkidle' });

    const allCategories = await this.page.$$('.border.rounded-lg');
    const noLocks = await this.page.$$('svg[data-lucide="lock"]');

    if (noLocks.length === 0 && allCategories.length >= 5) {
      this.results.passed.push('✅ All categories unlocked for premium users');
    } else {
      this.results.failed.push('❌ Some categories still locked for premium');
    }
  }

  async testSecurityMeasures() {
    log('\n🔐 Testing Security Measures...', 'magenta');
    log('=' .repeat(50), 'cyan');

    // Test 1: LocalStorage Manipulation
    log('\n📋 Test 1: LocalStorage Tampering Protection', 'blue');

    // Try to modify subscription status in localStorage
    await this.page.evaluate(() => {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.state && parsed.state.user) {
          parsed.state.user.subscriptionPlan = 'premium';
          parsed.state.user.subscriptionStatus = 'active';
          localStorage.setItem('auth-storage', JSON.stringify(parsed));
        }
      }
    });

    // Reload and check if still restricted
    await this.page.reload({ waitUntil: 'networkidle' });
    await this.page.goto(`${TEST_URL}/analytics`, { waitUntil: 'networkidle' });

    const stillBlocked = await this.page.$('text=/Premium Only/i');
    if (stillBlocked) {
      this.results.passed.push('✅ LocalStorage tampering prevented');
    } else {
      this.results.failed.push('❌ LocalStorage tampering not prevented!');
    }

    // Test 2: API Call Interception
    log('\n📋 Test 2: API Call Security', 'blue');

    // Monitor network requests for subscription checks
    const apiCalls = [];
    this.page.on('request', request => {
      if (request.url().includes('subscription') || request.url().includes('checkout')) {
        apiCalls.push(request.url());
      }
    });

    await this.page.goto(`${TEST_URL}/settings`, { waitUntil: 'networkidle' });

    if (apiCalls.length > 0) {
      this.results.passed.push('✅ Subscription verification API calls detected');
    }

    // Test 3: Console Command Injection
    log('\n📋 Test 3: Console Command Protection', 'blue');

    // Try to access premium features via console
    const consoleResult = await this.page.evaluate(() => {
      try {
        // Attempt to call premium functions directly
        window.usePremiumFeature = () => ({ isAvailable: true });
        return 'modified';
      } catch (e) {
        return 'protected';
      }
    });

    if (consoleResult === 'protected') {
      this.results.passed.push('✅ Console injection protected');
    } else {
      // Verify it doesn't actually grant access
      await this.page.reload();
      const stillRestricted = await this.page.$('text=/Premium/i');
      if (stillRestricted) {
        this.results.passed.push('✅ Console modifications ineffective');
      }
    }
  }

  async runAllTests() {
    try {
      await this.init();

      log('\n🧪 PREMIUM ACCESS CONTROL TEST SUITE', 'cyan');
      log('=' .repeat(50), 'cyan');

      // Test as free user
      const freeLoginSuccess = await this.login(FREE_USER_EMAIL, FREE_USER_PASSWORD);
      if (freeLoginSuccess) {
        await this.testFreeUserRestrictions();
        await this.testSecurityMeasures();
      } else {
        log('\n⚠️  Creating test free user...', 'yellow');
        // In real scenario, would create user first
      }

      // Clear session
      await this.context.clearCookies();
      await this.page.evaluate(() => localStorage.clear());

      // Test as premium user
      const premiumLoginSuccess = await this.login(PREMIUM_USER_EMAIL, PREMIUM_USER_PASSWORD);
      if (premiumLoginSuccess) {
        await this.testPremiumUserAccess();
      } else {
        log('\n⚠️  Premium test user not available', 'yellow');
      }

      // Print results
      this.printResults();

    } catch (error) {
      log(`\n❌ Test suite error: ${error.message}`, 'red');
    } finally {
      await this.cleanup();
    }
  }

  printResults() {
    log('\n' + '=' .repeat(60), 'cyan');
    log('📊 TEST RESULTS SUMMARY', 'cyan');
    log('=' .repeat(60), 'cyan');

    const total = this.results.passed.length + this.results.failed.length;
    const passRate = total > 0 ? (this.results.passed.length / total * 100).toFixed(1) : 0;

    log(`\n📈 Pass Rate: ${passRate}% (${this.results.passed.length}/${total})`, 'cyan');

    if (this.results.passed.length > 0) {
      log('\n✅ PASSED TESTS:', 'green');
      this.results.passed.forEach(test => log(test, 'green'));
    }

    if (this.results.failed.length > 0) {
      log('\n❌ FAILED TESTS:', 'red');
      this.results.failed.forEach(test => log(test, 'red'));
    }

    if (this.results.warnings.length > 0) {
      log('\n⚠️  WARNINGS:', 'yellow');
      this.results.warnings.slice(0, 5).forEach(warning => log(warning, 'yellow'));
    }

    // Overall verdict
    log('\n' + '=' .repeat(60), 'cyan');
    if (this.results.failed.length === 0) {
      log('🎉 ALL PREMIUM ACCESS CONTROLS WORKING CORRECTLY!', 'green');
      log('Free users cannot access premium features.', 'green');
      log('Premium features are properly protected.', 'green');
    } else {
      log('⚠️  SECURITY ISSUES DETECTED!', 'red');
      log(`${this.results.failed.length} test(s) failed.`, 'red');
      log('Premium features may be accessible to free users!', 'red');
    }
    log('=' .repeat(60), 'cyan');
  }
}

// Run the test
const tester = new PremiumAccessTester();
tester.runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});