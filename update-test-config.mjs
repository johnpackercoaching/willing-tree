#!/usr/bin/env node

/**
 * Update test configuration with correct user credentials
 */

import fs from 'fs';
import path from 'path';

// Known Firebase users
const FIREBASE_USERS = {
  primary: {
    email: 'johnmpacker1@gmail.com',
    uid: 'imdV4oRt8LM6CqTDiNxrBi8Xhz12',
    displayName: 'John Packer',
    status: 'EXISTS - Password needs reset'
  },
  test: {
    email: 'willingtree.test.2024@gmail.com',
    uid: 'BsoevZBpT6PEr96U5goevkxGbcX2',
    displayName: 'Test User',
    status: 'EXISTS - Password unknown'
  },
  business: {
    email: 'john@johnpackercoaching.com',
    uid: 'IvE9z6AiZrXUSyvcVAIyW0IhlJf1',
    displayName: 'Johnny',
    status: 'EXISTS - Password unknown'
  }
};

// Create test configuration file
const testConfig = {
  firebase: {
    project: 'willing-tree-fork',
    users: FIREBASE_USERS
  },
  recommendations: [
    '1. Use willingtree.test.2024@gmail.com as primary test account',
    '2. Reset password for johnmpacker1@gmail.com via Firebase Console',
    '3. Set consistent password (e.g., W7illing_1005) for all test accounts',
    '4. Update all test files to use verified credentials'
  ],
  testFiles: [
    'tests/e2e/welcome-screen-qa.spec.ts',
    'tests/e2e/auth-verification.spec.ts',
    'test-auth-simple.mjs'
  ]
};

// Save configuration
fs.writeFileSync(
  'test-config.json',
  JSON.stringify(testConfig, null, 2)
);

console.log('=====================================');
console.log('📝 TEST CONFIGURATION UPDATED');
console.log('=====================================\n');

console.log('Known Firebase Users:');
Object.entries(FIREBASE_USERS).forEach(([key, user]) => {
  console.log(`\n${key.toUpperCase()}:`);
  console.log(`  Email: ${user.email}`);
  console.log(`  UID: ${user.uid}`);
  console.log(`  Name: ${user.displayName}`);
  console.log(`  Status: ${user.status}`);
});

console.log('\n\nRecommendations:');
testConfig.recommendations.forEach((rec, i) => {
  console.log(`  ${rec}`);
});

console.log('\n\nTest files to update:');
testConfig.testFiles.forEach(file => {
  console.log(`  - ${file}`);
});

console.log('\n=====================================');
console.log('Configuration saved to: test-config.json');
console.log('=====================================');