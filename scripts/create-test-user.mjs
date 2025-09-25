#!/usr/bin/env node
/**
 * Create test user in Firebase for E2E tests
 * Run with: node scripts/create-test-user.mjs
 *
 * SECURITY: This script reads Firebase configuration from environment variables
 * Ensure your .env file is properly configured before running
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(dirname(__dirname), '.env');

// Parse .env file
const envVars = {};
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} else {
  console.error('❌ .env file not found!');
  process.exit(1);
}

// Firebase config from ENVIRONMENT VARIABLES (not hardcoded!)
const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID
};

// Validate that environment variables are set
if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase configuration not found in environment variables!');
  console.error('Please ensure your .env file contains:');
  console.error('  VITE_FIREBASE_API_KEY=your-api-key');
  console.error('  VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain');
  console.error('  VITE_FIREBASE_PROJECT_ID=your-project-id');
  console.error('  (and other Firebase config variables)');
  process.exit(1);
}

// Test user credentials (same as in tests)
const TEST_USER = {
  email: 'willingtree.test.2024@gmail.com',
  password: 'TestUser2024!Secure',
  displayName: 'Test User',
  subscriptionPlan: 'free',
  subscriptionStatus: 'active'
};

async function createTestUser() {
  console.log('🚀 Creating test user for Willing Tree...');
  console.log(`📧 Email: ${TEST_USER.email}`);
  console.log(`🔐 Password: ${TEST_USER.password}`);
  console.log(`🏗️  Project: ${firebaseConfig.projectId}`);
  console.log('=====================================\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Try to create the user
    console.log('Creating user in Firebase Auth...');
    let userCredential;

    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        TEST_USER.email,
        TEST_USER.password
      );
      console.log('✅ User created successfully!');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  User already exists, signing in instead...');
        userCredential = await signInWithEmailAndPassword(
          auth,
          TEST_USER.email,
          TEST_USER.password
        );
        console.log('✅ Signed in to existing user!');
      } else {
        throw error;
      }
    }

    // Create/Update user document in Firestore
    console.log('Creating user document in Firestore...');
    const userDoc = {
      email: TEST_USER.email,
      displayName: TEST_USER.displayName,
      subscriptionPlan: TEST_USER.subscriptionPlan,
      subscriptionStatus: TEST_USER.subscriptionStatus,
      role: 'user',
      testAccount: true,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc, { merge: true });
    console.log('✅ User document created/updated in Firestore!');

    console.log('\n=====================================');
    console.log('🎉 Test user setup complete!');
    console.log('=====================================');
    console.log('User Details:');
    console.log(`  UID: ${userCredential.user.uid}`);
    console.log(`  Email: ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log(`  Display Name: ${TEST_USER.displayName}`);
    console.log('\nYou can now use these credentials in your tests.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
createTestUser();