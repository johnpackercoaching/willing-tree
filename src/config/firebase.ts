import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { getAnalytics, type Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug logging removed - was logging sensitive config

// Firebase service instances - will be initialized asynchronously
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let analytics: Analytics | null = null;

// Initialization state
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Exponential backoff utility
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize Firebase with retry logic and exponential backoff
export async function initializeFirebase(): Promise<void> {
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Return immediately if already initialized
  if (isInitialized) {
    return Promise.resolve();
  }

  initializationPromise = (async () => {
    const retryDelays = [1000, 2000, 4000]; // 1s, 2s, 4s
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      try {
        // Initialize Firebase app
        if (!app) {
          app = initializeApp(firebaseConfig);
        }

        // Initialize services
        if (!auth) {
          auth = getAuth(app);
        }

        if (!db) {
          db = getFirestore(app);
        }

        if (!functions) {
          functions = getFunctions(app);
        }

        if (!analytics && typeof window !== 'undefined') {
          analytics = getAnalytics(app);
        }

        // Mark as initialized
        isInitialized = true;
        return;
      } catch (error) {
        lastError = error as Error;

        // If we haven't exhausted retries, wait and try again
        if (attempt < retryDelays.length) {
          await delay(retryDelays[attempt]);
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to initialize Firebase after ${retryDelays.length} retries: ${lastError?.message || 'Unknown error'}`);
  })();

  return initializationPromise;
}

// Export getters that ensure Firebase is initialized
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase app not initialized. Call initializeFirebase() first.');
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    throw new Error('Firebase functions not initialized. Call initializeFirebase() first.');
  }
  return functions;
}

export function getFirebaseAnalytics(): Analytics | null {
  return analytics;
}

// For backward compatibility, export the services directly
// Note: These will throw if accessed before initialization
export { auth, db, functions, analytics };

// Connect to emulators after initialization
export async function connectToEmulators(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'true') {
    return;
  }

  // Ensure Firebase is initialized first
  await initializeFirebase();

  try {
    // Check if emulators are already connected by attempting to connect
    // Firebase SDK will throw if already connected
    if (auth) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    }
  } catch (error) {
    // Already connected, ignore
  }

  try {
    if (db) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  } catch (error) {
    // Already connected, ignore
  }

  try {
    if (functions) {
      connectFunctionsEmulator(functions, 'localhost', 5001);
    }
  } catch (error) {
    // Already connected, ignore
  }
}