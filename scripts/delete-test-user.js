#!/usr/bin/env node

/**
 * Script to delete test users from the Willing Tree application
 * This uses Firebase Admin SDK simulation via client SDK
 *
 * Note: This script can only delete the Firestore document.
 * To fully delete a user from Authentication, you need to use Firebase Console
 * or implement a Cloud Function with Admin SDK.
 *
 * Usage:
 *   node scripts/delete-test-user.js --email test@example.com
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  deleteUser,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
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

// Validate required arguments
if (!argMap.email) {
  console.error('❌ Email is required');
  console.error('\nUsage:');
  console.error('  node scripts/delete-test-user.js --email test@example.com');
  console.error('\nOptions:');
  console.error('  --email <email>    Email of the test user to delete (required)');
  console.error('  --password <pass>  Password for self-deletion (optional)');
  console.error('  --force            Skip confirmation prompt');
  process.exit(1);
}

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

// Initialize Firebase
function initializeFirebaseApp() {
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('✅ Firebase initialized successfully');
    return { app, auth, db };
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    process.exit(1);
  }
}

// Delete test user
async function deleteTestUser(auth, db) {
  const email = argMap.email.toLowerCase();
  const password = argMap.password;

  try {
    console.log('\n🔍 Looking for user:', email);

    // Check if user document exists in Firestore
    const userDocRef = doc(db, 'users', email);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('⚠️  No user document found in Firestore for:', email);
    } else {
      const userData = userDoc.data();
      console.log('✅ Found user document:');
      console.log('   Display Name:', userData.displayName);
      console.log('   UID:', userData.uid);
      console.log('   Role:', userData.role);
      console.log('   Test Account:', userData.testAccount ? 'Yes' : 'No');

      // Delete Firestore document
      await deleteDoc(userDocRef);
      console.log('✅ Deleted user document from Firestore');
    }

    // Try to delete from Authentication if password is provided
    if (password) {
      console.log('\n🔐 Attempting to delete from Authentication...');
      try {
        // Sign in as the user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Delete the user from Authentication
        await deleteUser(user);
        console.log('✅ Deleted user from Firebase Authentication');
      } catch (authError) {
        if (authError.code === 'auth/user-not-found') {
          console.log('ℹ️  User not found in Authentication (may already be deleted)');
        } else if (authError.code === 'auth/wrong-password') {
          console.log('⚠️  Invalid password. User remains in Authentication.');
          console.log('   To fully delete, use Firebase Console or provide correct password.');
        } else {
          console.log('⚠️  Could not delete from Authentication:', authError.message);
          console.log('   User document was removed from Firestore.');
        }
      }
    } else {
      console.log('\nℹ️  Note: To delete from Authentication, provide password:');
      console.log('   node scripts/delete-test-user.js --email', email, '--password <password>');
      console.log('\n   Or delete manually from Firebase Console:');
      console.log('   https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/users');
    }

    // Clean up - sign out if signed in
    try {
      await signOut(auth);
    } catch (e) {
      // Ignore sign out errors
    }

    return { success: true };

  } catch (error) {
    console.error('\n❌ Error deleting user:', error.message);
    return { success: false, error: error.message };
  }
}

// Confirmation prompt (simple implementation)
async function confirmDeletion(email) {
  if (argMap.force) {
    return true;
  }

  console.log('\n⚠️  WARNING: This will delete the user:', email);
  console.log('   This action cannot be undone.');
  console.log('\n   To confirm, run with --force flag:');
  console.log('   node scripts/delete-test-user.js --email', email, '--force');

  return false;
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('  Willing Tree - Test User Deletion');
  console.log('========================================\n');

  // Confirm deletion
  const confirmed = await confirmDeletion(argMap.email);
  if (!confirmed) {
    console.log('\n❌ Deletion cancelled');
    process.exit(0);
  }

  // Initialize Firebase
  const { auth, db } = initializeFirebaseApp();

  // Delete test user
  const result = await deleteTestUser(auth, db);

  if (result.success) {
    console.log('\n========================================');
    console.log('✅ User deletion completed');
    console.log('========================================');
  } else {
    console.log('\n========================================');
    console.log('❌ User deletion failed');
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