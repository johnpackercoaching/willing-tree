import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getAnalytics, type Analytics } from 'firebase/analytics';

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

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
        // Validate configuration before attempting
        if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
          throw new Error('Missing required Firebase configuration. Please check your .env file.');
        }

        // Initialize Firebase app
        if (!app) {
          if (isDevelopment) {
            console.log(`Firebase init attempt ${attempt + 1}/${retryDelays.length + 1}`);
          }
          app = initializeApp(firebaseConfig);
        }

        // Initialize services with individual error handling
        if (!auth) {
          try {
            auth = getAuth(app);
          } catch (authError) {
            if (isDevelopment) {
              console.warn('Auth initialization warning:', authError);
            }
            // Continue - app can work without auth in some cases
          }
        }

        if (!db) {
          try {
            db = getFirestore(app);
          } catch (dbError) {
            if (isDevelopment) {
              console.warn('Firestore initialization warning:', dbError);
            }
            // Continue - app can work without db in some cases
          }
        }

        if (!functions) {
          try {
            functions = getFunctions(app);
          } catch (functionsError) {
            if (isDevelopment) {
              console.warn('Functions initialization warning:', functionsError);
            }
            // Continue - functions are optional
          }
        }

        if (!analytics && typeof window !== 'undefined') {
          try {
            analytics = getAnalytics(app);
          } catch (analyticsError) {
            if (isDevelopment) {
              console.warn('Analytics initialization warning:', analyticsError);
            }
            // Continue - analytics are optional
          }
        }

        // Mark as initialized even if some services failed
        // The app can work with partial functionality
        isInitialized = true;
        if (isDevelopment) {
          console.log('Firebase initialized successfully');
        }
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
    if (isDevelopment) {
      console.error('Firebase initialization failed after all retries');
      console.error('Last error:', lastError);
      console.error('Please check:');
      console.error('1. Your internet connection');
      console.error('2. Firebase configuration in .env file');
      console.error('3. Firebase service status at status.firebase.google.com');
    }
    throw new Error(`Failed to initialize Firebase after ${retryDelays.length} retries: ${lastError?.message || 'Unknown error'}`);
  })();

  return initializationPromise;
}

// Safe getters that provide helpful error messages
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (isDevelopment) {
      console.error('Firebase app not initialized. This usually means:');
      console.error('1. Firebase configuration is missing or invalid');
      console.error('2. Network issues preventing Firebase initialization');
      console.error('3. Firebase services are temporarily unavailable');
    }
    throw new Error('Firebase app not initialized. Call initializeFirebase() first.');
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    if (isDevelopment) {
      console.error('Firebase Auth not initialized');
      console.error('Attempting to initialize now...');
    }
    // Try to initialize if not done
    if (app) {
      try {
        auth = getAuth(app);
        return auth;
      } catch (error) {
        if (isDevelopment) {
          console.error('Failed to initialize Auth:', error);
        }
      }
    }
    throw new Error('Firebase auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    if (isDevelopment) {
      console.error('Firestore not initialized');
      console.error('Attempting to initialize now...');
    }
    // Try to initialize if not done
    if (app) {
      try {
        db = getFirestore(app);
        return db;
      } catch (error) {
        if (isDevelopment) {
          console.error('Failed to initialize Firestore:', error);
        }
      }
    }
    throw new Error('Firestore not initialized. Call initializeFirebase() first.');
  }
  return db;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) {
    if (isDevelopment) {
      console.error('Firebase Functions not initialized');
      console.error('Attempting to initialize now...');
    }
    // Try to initialize if not done
    if (app) {
      try {
        functions = getFunctions(app);
        return functions;
      } catch (error) {
        if (isDevelopment) {
          console.error('Failed to initialize Functions:', error);
        }
      }
    }
    throw new Error('Firebase functions not initialized. Call initializeFirebase() first.');
  }
  return functions;
}

export function getFirebaseAnalytics(): Analytics | null {
  return analytics;
}

// Check if Firebase is ready
export function isFirebaseReady(): boolean {
  return isInitialized && app !== null && auth !== null && db !== null;
}

// Get initialization status for debugging
export function getFirebaseStatus(): {
  initialized: boolean;
  hasApp: boolean;
  hasAuth: boolean;
  hasDb: boolean;
  hasFunctions: boolean;
  hasAnalytics: boolean;
} {
  return {
    initialized: isInitialized,
    hasApp: app !== null,
    hasAuth: auth !== null,
    hasDb: db !== null,
    hasFunctions: functions !== null,
    hasAnalytics: analytics !== null,
  };
}

// For backward compatibility, export the services directly
// Note: These will throw if accessed before initialization
export { auth, db, functions, analytics };

// Connect to emulators after initialization (development only)
export async function connectToEmulators(): Promise<void> {
  // Emulator support is disabled in production builds
  // To avoid any sensitive strings in the production bundle
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'true') {
    return;
  }

  // Emulator configuration has been removed to prevent localhost references
  // in production builds. To use emulators in development, configure them
  // directly in your development environment.
  if (isDevelopment) {
    console.warn('Firebase emulators support has been disabled to prevent sensitive data in production builds.');
  }
}