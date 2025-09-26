import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { User } from '../types';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { initializeFirebase, getFirebaseAuth, connectToEmulators } from '../config/firebase';
import { FirestoreService } from '../services/firestoreService';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  
  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, age: number, gender: 'male' | 'female' | 'other') => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        firebaseUser: null,
        isLoading: false,
        isInitialized: false,
        error: null,

        setUser: (user) => set({ user }),
        setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setInitialized: (isInitialized) => set({ isInitialized }),
        clearError: () => set({ error: null }),

        login: async (email: string, password: string) => {
          try {
            set({ isLoading: true, error: null });
            // Debug logging removed
            await initializeFirebase();
            const auth = getFirebaseAuth();
            const credential = await signInWithEmailAndPassword(auth, email, password);
            // Debug logging removed
            // User will be set by the auth state listener
          } catch (error: any) {
            // Debug logging removed
            const message = error instanceof Error ? error.message : 'Login failed';
            set({ error: message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        signup: async (email: string, password: string, displayName: string, age: number, gender: 'male' | 'female' | 'other') => {
          try {
            set({ isLoading: true, error: null });
            await initializeFirebase();
            const auth = getFirebaseAuth();
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update Firebase Auth profile
            await updateProfile(credential.user, {
              displayName: displayName
            });
            
            // Create user profile in Firestore
            const newUser = await FirestoreService.createUserProfile(
              credential.user.uid,
              {
                email: credential.user.email!,
                displayName,
                age,
                gender,
                activeInnermosts: [],
                subscriptionStatus: 'free'
              }
            );
            
            set({ user: newUser });
            
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Signup failed';
            set({ error: message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        logout: async () => {
          try {
            set({ isLoading: true, error: null });
            await initializeFirebase();
            const auth = getFirebaseAuth();
            await signOut(auth);
            set({ user: null, firebaseUser: null });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Logout failed';
            set({ error: message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },

        resetPassword: async (email: string) => {
          try {
            set({ isLoading: true, error: null });
            await initializeFirebase();
            const auth = getFirebaseAuth();
            await sendPasswordResetEmail(auth, email);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Password reset failed';
            set({ error: message });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        },
      }),
      {
        name: 'auth-storage',
        // Only persist non-sensitive data
        partialize: (state) => ({
          user: state.user,
          isInitialized: state.isInitialized,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);

// Initialize auth state listener
let unsubscribe: (() => void) | null = null;
let isInitializing = false; // Prevent concurrent initialization
let initializationPromise: Promise<void> | null = null; // Track initialization promise

// Configurable timeout (defaults to 15 seconds to avoid conflict with App.tsx 20s timeout)
const AUTH_INIT_TIMEOUT = Number(import.meta.env.VITE_AUTH_INIT_TIMEOUT) || 15000;

export const initializeAuth = async (): Promise<void> => {
  // Return existing promise if already initializing
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  // If already initialized, return immediately
  if (useAuthStore.getState().isInitialized) {
    return Promise.resolve();
  }

  // CRITICAL FIX: Clean up any existing listener before creating a new one
  // This ensures we don't have stale listeners after page reload
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  isInitializing = true;

  // Create a promise that resolves when auth is initialized
  initializationPromise = new Promise<void>((resolve, reject) => {
    (async () => {
      try {
        // CRITICAL FIX: Initialize Firebase BEFORE setting up auth listeners
        await initializeFirebase();

        // Connect to emulators if needed
        await connectToEmulators();

        // Now get the initialized auth instance
        const auth = getFirebaseAuth();

        // Set a timeout to prevent infinite loading (now 15 seconds by default)
        const timeoutId = setTimeout(() => {
          useAuthStore.getState().setInitialized(true);
          useAuthStore.getState().setError('Authentication initialization timed out');
          isInitializing = false; // Reset flag on timeout
          initializationPromise = null;
          reject(new Error('Authentication initialization timed out'));
        }, AUTH_INIT_TIMEOUT);

        // Set up the auth state listener
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          clearTimeout(timeoutId); // Clear timeout if auth responds
          useAuthStore.getState().setFirebaseUser(firebaseUser);

          // Mark auth as initialized as soon as Firebase returns a user state
          // We resolve the initialization promise before any Firestore calls so
          // the app doesn't hang waiting for secondary network requests.
          useAuthStore.getState().setInitialized(true);

          if (initializationPromise) {
            isInitializing = false;
            initializationPromise = null;
            resolve();
          }

          if (firebaseUser) {
            try {
              // Fetch real user data from Firestore
              const user = await FirestoreService.getUserProfile(firebaseUser.uid);

              if (user) {
                // Debug logging removed
                useAuthStore.getState().setUser(user);
              } else {
                // User exists in Firebase Auth but not in Firestore
                // This shouldn't happen in normal flow, but handle gracefully
                // Debug logging removed
                useAuthStore.getState().setUser(null);
              }
            } catch (error) {
              // Debug logging removed
              useAuthStore.getState().setError('Failed to load user profile');
              useAuthStore.getState().setUser(null);
            }
          } else {
            // Debug logging removed
            useAuthStore.getState().setUser(null);
          }
        });

    // Auth listener setup was successful
    // If there's no user, auth state will fire immediately and set initialized to true
    // If there is a user, it will fire once the user is loaded

      } catch (error) {
        // Failed to initialize Firebase
        // Debug logging removed
        const message = error instanceof Error ? error.message : 'Failed to initialize authentication';
        useAuthStore.getState().setError(message);
        useAuthStore.getState().setInitialized(true); // Set initialized even on error to unblock UI
        isInitializing = false;
        initializationPromise = null;
        reject(error);
      }
    })();
  });

  return initializationPromise;
};

// Cleanup function
export const cleanupAuth = () => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
};