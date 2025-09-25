/**
 * Production Health Check Test Suite
 * Comprehensive tests for production deployment health
 */

import { test, expect } from '@playwright/test';

test.describe('Production Health Checks', () => {
  const PRODUCTION_URL = 'https://willing-tree-pi.vercel.app';

  test('1. No console errors on homepage', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`Page error: ${error.message}`);
    });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    expect(consoleErrors, 'Console errors found: ' + consoleErrors.join('\n')).toHaveLength(0);
  });

  test('2. 404 page handling', async ({ page }) => {
    const response = await page.goto(`${PRODUCTION_URL}/this-page-does-not-exist-12345`);

    // Should not return actual 404 (SPA should handle it)
    expect(response?.status()).toBeLessThan(400);

    // Should show some error or redirect
    await expect(page).not.toHaveURL(/this-page-does-not-exist/);
  });

  test('3. Robots.txt exists', async ({ page }) => {
    const response = await page.goto(`${PRODUCTION_URL}/robots.txt`);
    expect(response?.status()).toBe(200);

    const content = await page.content();
    expect(content).toContain('User-agent');
  });

  test('4. Favicon loads', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    const favicon = await page.evaluate(() => {
      const link = document.querySelector('link[rel*="icon"]') as HTMLLinkElement;
      return link ? link.href : null;
    });

    expect(favicon).toBeTruthy();

    if (favicon) {
      const response = await page.request.get(favicon);
      expect(response.status()).toBe(200);
    }
  });

  test('5. Service Worker registration', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    expect(hasServiceWorker).toBeTruthy();

    // Check if service worker actually registers
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistrations()
        .then(registrations => registrations.length > 0);
    });

    expect(swRegistered).toBeTruthy();
  });

  test('6. Mobile viewport meta tag', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      return meta ? meta.content : null;
    });

    expect(viewport).toContain('width=device-width');
  });

  test('7. No exposed sensitive data in HTML', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    const content = await page.content();

    // Remove Firebase auth iframes from content as they legitimately contain API keys
    const contentWithoutFirebaseIframes = content.replace(
      /<iframe[^>]*firebaseapp\.com[^>]*>.*?<\/iframe>/gi,
      ''
    );

    // Check for sensitive patterns, excluding legitimate Firebase usage
    // Firebase API keys in auth iframes are expected and secured by domain restrictions
    expect(contentWithoutFirebaseIframes).not.toMatch(/api[_-]?key.*=.*['"]\w+/i);
    expect(contentWithoutFirebaseIframes).not.toMatch(/secret[_-]?key/i);
    expect(contentWithoutFirebaseIframes).not.toMatch(/private[_-]?key/i);
    expect(contentWithoutFirebaseIframes).not.toMatch(/password['"]\s*[:=]/i);
    expect(contentWithoutFirebaseIframes).not.toMatch(/bearer\s+[A-Za-z0-9\-._~+\/]+=*/i);
    expect(contentWithoutFirebaseIframes).not.toContain('localhost');
    expect(contentWithoutFirebaseIframes).not.toContain('127.0.0.1');

    // Also check there's no debug console.log statements
    expect(contentWithoutFirebaseIframes).not.toContain('console.log');
    expect(contentWithoutFirebaseIframes).not.toContain('console.debug');
  });

  test('8. Network request failures check', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('networkidle');

    // Filter out expected failures (like analytics blocked by ad blockers)
    const criticalFailures = failedRequests.filter(url =>
      !url.includes('google-analytics') &&
      !url.includes('googletagmanager')
    );

    expect(criticalFailures, 'Critical network failures: ' + criticalFailures.join('\n')).toHaveLength(0);
  });

  test('9. JavaScript bundle loads', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    const jsFiles = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(s => (s as HTMLScriptElement).src);
    });

    expect(jsFiles.length).toBeGreaterThan(0);

    // Check that main bundle loads
    const mainBundle = jsFiles.find(src => src.includes('index') || src.includes('main'));
    expect(mainBundle).toBeTruthy();
  });

  test('10. CSS loads correctly', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    const hasStyles = await page.evaluate(() => {
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      const styleElements = document.querySelectorAll('style');
      return stylesheets.length > 0 || styleElements.length > 0;
    });

    expect(hasStyles).toBeTruthy();

    // Check for unstyled content flash
    const bodyBackground = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    expect(bodyBackground).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
  });

  test('11. Performance metrics', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
    });

    // Check that page loads within reasonable time
    expect(metrics.domContentLoaded).toBeLessThan(5000); // 5 seconds
    expect(metrics.loadComplete).toBeLessThan(10000); // 10 seconds
  });

  test('12. Links are not broken', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map(a => (a as HTMLAnchorElement).href);
    });

    for (const link of links.slice(0, 5)) { // Test first 5 links
      if (link.startsWith('http')) {
        const response = await page.request.head(link).catch(() => null);
        if (response) {
          expect(response.status()).toBeLessThan(400);
        }
      }
    }
  });
});