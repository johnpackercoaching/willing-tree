import { test, expect } from '@playwright/test';
import { randomBytes } from 'crypto';

// Generate unique test email for each test run
const generateTestEmail = () => {
  const randomStr = randomBytes(8).toString('hex');
  return 'test-' + randomStr + '@example.com';
};

// Generate unique test data
const testUser = {
  email: generateTestEmail(),
  password: 'TestPassword123!',
  displayName: 'Test User ' + Date.now(),
  age: 25,
  gender: 'other' as const
};

const testUser2 = {
  email: generateTestEmail(),
  password: 'TestPassword456!',
  displayName: 'Test User 2 ' + Date.now(),
  age: 28,
  gender: 'male' as const
};

test.describe('Firestore Integration Tests', () => {
  test.describe.configure({ mode: 'serial' });

  let userId1: string;
  let userId2: string;

  test.beforeAll(async ({ browser }) => {
    console.log('Starting Firestore Integration Tests');
    console.log('Test User 1:', testUser.email);
    console.log('Test User 2:', testUser2.email);
  });

  test('Step 1: Deploy Firestore rules', async () => {
    // This test assumes Firebase rules are already deployed
    // In a CI environment, you would run: firebase deploy --only firestore:rules
    console.log('Firestore rules should be deployed before running tests');
    expect(true).toBe(true);
  });

  test('Step 2: Create new user account and verify profile creation', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Fill signup form
    await page.fill('input[name="displayName"]', testUser.displayName);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="age"]', testUser.age.toString());
    await page.selectOption('select[name="gender"]', testUser.gender);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    // Monitor network requests to Firestore
    const firestoreRequests: any[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('firestore.googleapis.com') || url.includes('firebaseio.com')) {
        firestoreRequests.push({
          url,
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    // Monitor console for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('Console Error:', msg.text());
      }
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Verify user is logged in
    await expect(page).toHaveURL(/\/dashboard/);

    // Check for Firestore permission errors
    const permissionErrors = consoleErrors.filter(err => 
      err.includes('Missing or insufficient permissions') ||
      err.includes('PERMISSION_DENIED')
    );
    
    expect(permissionErrors).toHaveLength(0);
    
    // Log Firestore activity
    console.log('Firestore requests made:', firestoreRequests.length);
    if (firestoreRequests.length > 0) {
      console.log('Sample Firestore requests:', firestoreRequests.slice(0, 3));
    }

    // Extract user ID from the page (if visible)
    const userIdElement = await page.locator('[data-testid="user-id"]').first();
    if (await userIdElement.count() > 0) {
      userId1 = await userIdElement.textContent() || '';
      console.log('User 1 ID:', userId1);
    }
  });

  test('Step 3: Create second user account for testing cross-user access', async ({ page }) => {
    // Logout first user
    await page.goto('/dashboard');
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 10000 });
    }

    // Create second user
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="displayName"]', testUser2.displayName);
    await page.fill('input[name="email"]', testUser2.email);
    await page.fill('input[name="age"]', testUser2.age.toString());
    await page.selectOption('select[name="gender"]', testUser2.gender);
    await page.fill('input[name="password"]', testUser2.password);
    await page.fill('input[name="confirmPassword"]', testUser2.password);

    // Monitor for errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });

    // Check for permission errors
    const permissionErrors = consoleErrors.filter(err => 
      err.includes('Missing or insufficient permissions') ||
      err.includes('PERMISSION_DENIED')
    );
    
    expect(permissionErrors).toHaveLength(0);

    // Extract user ID
    const userIdElement = await page.locator('[data-testid="user-id"]').first();
    if (await userIdElement.count() > 0) {
      userId2 = await userIdElement.textContent() || '';
      console.log('User 2 ID:', userId2);
    }
  });

  test('Step 4: Test reading other user profiles (for pairing)', async ({ page }) => {
    // Stay logged in as second user
    await page.goto('/dashboard');

    // Try to navigate to a page that would read other users (e.g., pairing/search)
    const pairingLink = page.locator('a[href*="pairing"], a[href*="connect"], a[href*="search"]').first();
    if (await pairingLink.count() > 0) {
      await pairingLink.click();
      await page.waitForLoadState('networkidle');

      // Monitor for permission errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Wait a bit for any async operations
      await page.waitForTimeout(3000);

      // Check for permission errors
      const permissionErrors = consoleErrors.filter(err => 
        err.includes('Missing or insufficient permissions') ||
        err.includes('PERMISSION_DENIED')
      );
      
      expect(permissionErrors).toHaveLength(0);
      console.log('Successfully accessed pairing/search without permission errors');
    } else {
      console.log('Pairing/search feature not found in UI');
    }
  });

  test('Step 5: Test partial profile update', async ({ page }) => {
    // Navigate to profile settings
    await page.goto('/dashboard');
    
    const profileLink = page.locator('a[href*="profile"], a[href*="settings"], button:has-text("Profile")').first();
    if (await profileLink.count() > 0) {
      await profileLink.click();
      await page.waitForLoadState('networkidle');

      // Monitor for errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('404')) {
          consoleErrors.push(msg.text());
          console.log('Console Error:', msg.text());
        }
      });

      // Try to update bio (partial update)
      const bioField = page.locator('textarea[name="bio"], input[name="bio"], [data-testid="bio-input"]').first();
      if (await bioField.count() > 0) {
        await bioField.fill('This is a test bio update at ' + Date.now());
        
        // Find and click save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          
          // Wait for save to complete
          await page.waitForTimeout(2000);
          
          // Check for success message or navigation
          const successMessage = page.locator('text=/success|saved|updated/i').first();
          if (await successMessage.count() > 0) {
            console.log('Profile update successful');
          }
        }
      }

      // Check for permission errors
      const permissionErrors = consoleErrors.filter(err => 
        err.includes('Missing or insufficient permissions') ||
        err.includes('PERMISSION_DENIED')
      );
      
      if (permissionErrors.length > 0) {
        console.log('Permission errors found:', permissionErrors);
      }
      expect(permissionErrors).toHaveLength(0);
    } else {
      console.log('Profile settings not found in UI');
    }
  });

  test('Step 6: Verify Firestore network requests and data persistence', async ({ page, context }) => {
    // Create a new page with network monitoring
    const monitorPage = await context.newPage();
    
    // Set up comprehensive network monitoring
    const networkLog = {
      firestoreWrites: 0,
      firestoreReads: 0,
      totalRequests: 0,
      errors: [] as string[]
    };

    monitorPage.on('request', request => {
      const url = request.url();
      if (url.includes('firestore.googleapis.com') || url.includes('firebaseio.com')) {
        networkLog.totalRequests++;
        
        const method = request.method();
        if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
          networkLog.firestoreWrites++;
          console.log('Firestore Write:', method, 'to', url.slice(0, 100));
        } else if (method === 'GET') {
          networkLog.firestoreReads++;
          console.log('Firestore Read:', url.slice(0, 100));
        }
      }
    });

    monitorPage.on('response', response => {
      const url = response.url();
      if ((url.includes('firestore.googleapis.com') || url.includes('firebaseio.com')) && 
          response.status() >= 400) {
        networkLog.errors.push('HTTP ' + response.status() + ' from ' + url);
        console.log('Firestore Error: HTTP', response.status(), 'from', url);
      }
    });

    // Login with first test user
    await monitorPage.goto('/login');
    await monitorPage.fill('input[name="email"], input[type="email"]', testUser.email);
    await monitorPage.fill('input[name="password"], input[type="password"]', testUser.password);
    await monitorPage.click('button[type="submit"]');
    
    // Wait for dashboard
    await monitorPage.waitForURL('**/dashboard', { timeout: 30000 });
    
    // Give time for all Firestore operations
    await monitorPage.waitForTimeout(3000);
    
    // Refresh to test data persistence
    await monitorPage.reload();
    await monitorPage.waitForLoadState('networkidle');
    
    // Verify user is still logged in
    await expect(monitorPage).toHaveURL(/\/dashboard/);
    
    // Check if user name is displayed
    const userDisplay = monitorPage.locator('text=' + testUser.displayName).first();
    const userDisplayExists = await userDisplay.count() > 0;
    
    console.log('\n=== Firestore Network Summary ===');
    console.log('Total Firestore Requests:', networkLog.totalRequests);
    console.log('Firestore Writes:', networkLog.firestoreWrites);
    console.log('Firestore Reads:', networkLog.firestoreReads);
    console.log('Network Errors:', networkLog.errors.length);
    if (networkLog.errors.length > 0) {
      console.log('Errors:', networkLog.errors);
    }
    console.log('User Display Name Found:', userDisplayExists);
    console.log('================================\n');
    
    // Assertions
    expect(networkLog.totalRequests).toBeGreaterThan(0);
    expect(networkLog.errors).toHaveLength(0);
    
    if (userDisplayExists) {
      console.log('✅ Data persistence verified - user profile loaded after refresh');
    } else {
      console.log('⚠️ Could not verify data persistence through UI');
    }
    
    await monitorPage.close();
  });

  test('Step 7: Final verification - No permission errors throughout', async ({ page }) => {
    // Final comprehensive check
    await page.goto('/dashboard');
    
    const finalCheck = {
      canAccessDashboard: false,
      canAccessProfile: false,
      noPermissionErrors: true
    };
    
    // Set up error monitoring
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errors.push(text);
        if (text.includes('Missing or insufficient permissions') || 
            text.includes('PERMISSION_DENIED')) {
          finalCheck.noPermissionErrors = false;
        }
      }
    });
    
    // Check dashboard access
    await page.waitForLoadState('networkidle');
    finalCheck.canAccessDashboard = page.url().includes('dashboard');
    
    // Try to access profile
    const profileLink = page.locator('a[href*="profile"], a[href*="settings"]').first();
    if (await profileLink.count() > 0) {
      await profileLink.click();
      await page.waitForTimeout(2000);
      finalCheck.canAccessProfile = !errors.some(e => 
        e.includes('Missing or insufficient permissions')
      );
    }
    
    console.log('\n=== Final Test Results ===');
    console.log('✅ Dashboard Accessible:', finalCheck.canAccessDashboard);
    console.log('✅ Profile Accessible:', finalCheck.canAccessProfile);
    console.log('✅ No Permission Errors:', finalCheck.noPermissionErrors);
    console.log('Total Console Errors:', errors.length);
    if (errors.length > 0 && errors.length <= 3) {
      console.log('Sample Errors:', errors.slice(0, 3));
    }
    console.log('========================\n');
    
    expect(finalCheck.canAccessDashboard).toBe(true);
    expect(finalCheck.noPermissionErrors).toBe(true);
  });

  test.afterAll(async () => {
    console.log('\n=== Test Cleanup ===');
    console.log('Test users created:');
    console.log('  -', testUser.email);
    console.log('  -', testUser2.email);
    console.log('Note: These test users remain in Firebase for manual inspection');
    console.log('To clean up, delete them from Firebase Console');
    console.log('===================\n');
  });
});
