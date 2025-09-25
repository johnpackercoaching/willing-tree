#!/usr/bin/env node

/**
 * Script to create test users for the Willing Tree application
 * This uses the Firebase client SDK to create users programmatically
 *
 * Usage:
 *   node scripts/create-test-user.js
 *   node scripts/create-test-user.js --email custom@example.com --name "Custom User"
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = join(dirname(__dirname), '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  // Set environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].substring(2);
    argMap[key] = args[i + 1] || true;
    i++;
  }
}

// Default test user configuration (can be overridden via CLI args)
const TEST_USER_CONFIG = {
  email: argMap.email || process.env.TEST_USER_EMAIL || 'willingtree.test.2024@gmail.com',
  password: argMap.password || process.env.TEST_USER_PASSWORD || 'TestUser2024!Secure',
  displayName: argMap.name || process.env.TEST_USER_NAME || 'Test User 2024',
  // Additional user profile fields
  bio: argMap.bio || 'This is a test user account for development and testing purposes.',
  role: argMap.role || 'user', // Can be 'user' or 'admin'
  testAccount: true,
  createdBy: 'create-test-user.js'
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
function validateConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

  if (missingFields.length > 0) {
    console.error('❌ Missing required Firebase configuration fields:', missingFields.join(', '));
    console.error('\nPlease ensure your .env file contains all required Firebase configuration.');
    console.error('You can find these values in Firebase Console > Project Settings > General');
    process.exit(1);
  }

  console.log('✅ Firebase configuration validated');
}

// Initialize Firebase
function initializeFirebaseApp() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ Firebase initialized successfully');
    console.log('   Project ID:', firebaseConfig.projectId);
    console.log('   Auth Domain:', firebaseConfig.authDomain);

    return { app, auth, db };
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// Create test user
async function createTestUser(auth, db) {
  try {
    console.log('\n📝 Creating test user...');
    console.log('   Email:', TEST_USER_CONFIG.email);
    console.log('   Display Name:', TEST_USER_CONFIG.displayName);
    console.log('   Role:', TEST_USER_CONFIG.role);

    // Check if user already exists
    const userDocRef = doc(db, 'users', TEST_USER_CONFIG.email.toLowerCase());
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      console.log('\n⚠️  Warning: A user document already exists for this email.');
      console.log('   Attempting to create authentication account...');
    }

    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      TEST_USER_CONFIG.email,
      TEST_USER_CONFIG.password
    );

    const user = userCredential.user;
    console.log('✅ User authentication created successfully');
    console.log('   UID:', user.uid);

    // Update user profile
    await updateProfile(user, {
      displayName: TEST_USER_CONFIG.displayName,
      photoURL: null // Can be set to a default avatar URL if needed
    });
    console.log('✅ User profile updated');

    // Create or update Firestore user document
    const userData = {
      uid: user.uid,
      email: TEST_USER_CONFIG.email.toLowerCase(),
      displayName: TEST_USER_CONFIG.displayName,
      bio: TEST_USER_CONFIG.bio,
      role: TEST_USER_CONFIG.role,
      testAccount: TEST_USER_CONFIG.testAccount,
      createdBy: TEST_USER_CONFIG.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailVerified: false,
      profileComplete: true,
      settings: {
        notifications: {
          email: true,
          push: false
        },
        privacy: {
          showProfile: true,
          showEmail: false
        }
      },
      metadata: {
        lastLogin: null,
        loginCount: 0,
        platform: 'web',
        userAgent: 'create-test-user-script'
      }
    };

    await setDoc(userDocRef, userData, { merge: true });
    console.log('✅ User document created/updated in Firestore');

    // Sign out to clean up the session
    await signOut(auth);
    console.log('✅ Signed out successfully');

    return {
      success: true,
      uid: user.uid,
      email: TEST_USER_CONFIG.email,
      displayName: TEST_USER_CONFIG.displayName
    };

  } catch (error) {
    // Handle specific error cases
    if (error.code === 'auth/email-already-in-use') {
      console.error('\n❌ Error: This email is already registered.');
      console.error('   Email:', TEST_USER_CONFIG.email);
      console.error('\n   To create a different test user, use:');
      console.error('   node scripts/create-test-user.js --email another@example.com --name "Another User"');
    } else if (error.code === 'auth/weak-password') {
      console.error('\n❌ Error: The password is too weak.');
      console.error('   Please use a stronger password with at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('\n❌ Error: The email address is invalid.');
      console.error('   Email:', TEST_USER_CONFIG.email);
    } else {
      console.error('\n❌ Error creating test user:', error.message);
      console.error('   Error code:', error.code);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('  Willing Tree - Test User Creator');
  console.log('========================================\n');

  // Validate configuration
  validateConfig();

  // Initialize Firebase
  const { auth, db } = initializeFirebaseApp();

  // Create test user
  const result = await createTestUser(auth, db);

  if (result.success) {
    console.log('\n========================================');
    console.log('✅ Test user created successfully!');
    console.log('========================================');
    console.log('\nUser Details:');
    console.log('  Email:', result.email);
    console.log('  Display Name:', result.displayName);
    console.log('  UID:', result.uid);
    console.log('\nYou can now use these credentials to log in.');
    console.log('\n⚠️  Security Note: Never commit passwords to version control.');
    console.log('    Store them securely in environment variables or a password manager.');
  } else {
    console.log('\n========================================');
    console.log('❌ Failed to create test user');
    console.log('========================================');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error('\n❌ Script failed:', error.message);
  process.exit(1);
});