import { test, expect } from '@playwright/test';

test.describe('Smoke Tests for Willing Tree', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any storage
    await page.context().clearCookies();
  });

  test('application should be accessible', async ({ page }) => {
    // Navigate to the production URL
    const response = await page.goto('https://willing-tree-pi.vercel.app', { 
      waitUntil: 'networkidle' 
    });
    
    // Verify the page loads successfully
    expect(response?.status()).toBe(200);
    
    // Verify the title
    await expect(page).toHaveTitle(/willing.*tree/i);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'test-results/smoke-test-homepage.png',
      fullPage: true 
    });
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('https://willing-tree-pi.vercel.app');
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Try to find any interactive elements
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    const inputs = await page.locator('input').count();
    
    console.log(`Interactive elements - Buttons: ${buttons}, Links: ${links}, Inputs: ${inputs}`);
    
    // If there are interactive elements, try clicking the first button or link
    if (buttons > 0) {
      const firstButton = page.locator('button').first();
      const buttonText = await firstButton.textContent().catch(() => 'unknown');
      console.log('First button text:', buttonText);
    }
    
    if (links > 0) {
      const firstLink = page.locator('a').first();
      const linkText = await firstLink.textContent().catch(() => 'unknown');
      const linkHref = await firstLink.getAttribute('href').catch(() => 'unknown');
      console.log('First link:', linkText, '->', linkHref);
    }
  });

  test('should verify app structure', async ({ page }) => {
    await page.goto('https://willing-tree-pi.vercel.app');
    await page.waitForTimeout(2000);
    
    // Check for React app root
    const appRoot = page.locator('#root');
    await expect(appRoot).toBeAttached();
    
    // Get the rendered HTML structure
    const htmlContent = await page.content();
    
    // Verify basic HTML structure
    expect(htmlContent).toContain('<!DOCTYPE html>');
    expect(htmlContent).toContain('<head>');
    expect(htmlContent).toContain('<body>');
    
    // Check for viewport meta tag (important for responsive design)
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should test responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('https://willing-tree-pi.vercel.app');
    await page.screenshot({ 
      path: 'test-results/smoke-test-desktop.png' 
    });
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.screenshot({ 
      path: 'test-results/smoke-test-tablet.png' 
    });
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.screenshot({ 
      path: 'test-results/smoke-test-mobile.png' 
    });
  });

  test('should check for console errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('https://willing-tree-pi.vercel.app');
    await page.waitForTimeout(3000);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('google-analytics') &&
      !error.includes('Content Security Policy') &&
      !error.includes('X-Frame-Options') &&
      !error.includes('Installations: Create Installation') // Firebase installation error
    );
    
    // Log all errors for visibility
    if (errors.length > 0) {
      console.log('Console errors detected:', errors.length);
      errors.forEach(error => console.log(' -', error.substring(0, 100)));
    }
    
    // Only fail on critical errors
    expect(criticalErrors.length).toBe(0);
  });
});
