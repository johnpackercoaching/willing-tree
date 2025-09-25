import { chromium } from 'playwright';

const test = async () => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  
  // Track Firebase responses
  page.on('response', async res => {
    const url = res.url();
    if (url.includes('identitytoolkit') || url.includes('securetoken')) {
      console.log('FIREBASE RESPONSE:', res.status(), url);
      if (res.status() >= 400) {
        const body = await res.text();
        console.log('ERROR BODY:', body);
      }
    }
  });
  
  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  console.log('Testing: https://willing-tree-pi.vercel.app/auth/login');
  await page.goto('https://willing-tree-pi.vercel.app/auth/login');
  await page.waitForTimeout(3000);
  
  // Try login
  await page.fill('input[type="email"]', 'test@test.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(5000);
  
  // Check errors
  const errors = await page.locator('[role="alert"], .text-red-500').allTextContents();
  console.log('UI ERRORS:', errors);
  
  await page.screenshot({ path: '/tmp/firebase-error.png' });
  await page.waitForTimeout(5000);
  await browser.close();
};

test();
