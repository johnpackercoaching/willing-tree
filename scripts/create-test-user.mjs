#!/usr/bin/env node
/**
 * Create test user in Firebase for E2E tests
 * Run with: node scripts/create-test-user.mjs
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase config from production
const firebaseConfig = {
  apiKey: "AIzaSyCb0k6P1IdJP3_a2sJPpON3OLczjDJilu4",
  authDomain: "willing-tree-fork.firebaseapp.com",
  projectId: "willing-tree-fork",
  storageBucket: "willing-tree-fork.appspot.com",
  messagingSenderId: "105791805598",
  appId: "1:105791805598:web:acf539a97f52cf9bab438f"
};

// Test user credentials (same as in tests)
const TEST_USER = {
  email: 'willingtree.test.2024@gmail.com',
  password: 'TestUser2024!Secure',
  displayName: 'Test User',
  subscriptionPlan: 'free',
  subscriptionStatus: 'active'
};

async function createTestUser() {
  console.log('🔧 Creating test user for E2E tests...\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ Firebase initialized\n');

    // Try to sign in first (user might already exist)
    console.log(`📝 Checking if user ${TEST_USER.email} already exists...`);

    try {
      const existingUser = await signInWithEmailAndPassword(auth, TEST_USER.email, TEST_USER.password);
      console.log('✅ Test user already exists with UID:', existingUser.user.uid);
      console.log('✅ No action needed - user can be used for tests\n');
      process.exit(0);
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        console.log('User does not exist, creating new user...\n');
      } else {
        console.log('Error checking existing user:', error.message);
      }
    }

    // Create new user
    console.log('📝 Creating new user...');
    const userCredential = await createUserWithEmailAndPassword(auth, TEST_USER.email, TEST_USER.password);
    const user = userCredential.user;

    console.log('✅ User created successfully!');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);

    // Create user document in Firestore
    console.log('\n📝 Creating user profile in Firestore...');

    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: TEST_USER.displayName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      subscriptionPlan: TEST_USER.subscriptionPlan,
      subscriptionStatus: TEST_USER.subscriptionStatus,
      subscriptionEndDate: null,
      emailVerified: false,
      profileComplete: true,
      isTestUser: true // Mark as test user for easy cleanup
    });

    console.log('✅ User profile created in Firestore\n');

    // Sign out
    await auth.signOut();

    console.log('🎉 SUCCESS! Test user created and ready for E2E tests');
    console.log('   Email:', TEST_USER.email);
    console.log('   Password:', TEST_USER.password);
    console.log('\nYou can now run E2E tests against production.\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);

    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 This email is already registered.');
      console.log('   If you know the password, update it in tests/helpers/auth.helper.ts');
      console.log('   Or use a different email address.');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n💡 Password is too weak. Use a stronger password.');
    } else if (error.code === 'auth/invalid-api-key') {
      console.log('\n💡 Firebase API key is invalid. Check your configuration.');
    }

    process.exit(1);
  }
}

// Run the script
createTestUser();