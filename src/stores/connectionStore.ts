import { create } from 'zustand';
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';

interface ConnectionState {
  isOnline: boolean;
  firebaseConnected: boolean;
  firestoreConnected: boolean;
  authConnected: boolean;
  connectionError: string | null;
  retryCount: number;
  lastRetryTime: number | null;
  setOnline: (status: boolean) => void;
  setFirebaseConnected: (status: boolean) => void;
  setFirestoreConnected: (status: boolean) => void;
  setAuthConnected: (status: boolean) => void;
  setConnectionError: (error: string | null) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
  toggleOfflineMode: () => Promise<void>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isOnline: navigator.onLine,
  firebaseConnected: false,
  firestoreConnected: false,
  authConnected: false,
  connectionError: null,
  retryCount: 0,
  lastRetryTime: null,

  setOnline: (status) => set({ isOnline: status }),
  setFirebaseConnected: (status) => set({ firebaseConnected: status }),
  setFirestoreConnected: (status) => set({ firestoreConnected: status }),
  setAuthConnected: (status) => set({ authConnected: status }),
  setConnectionError: (error) => set({ connectionError: error }),

  incrementRetry: () => set(state => ({
    retryCount: state.retryCount + 1,
    lastRetryTime: Date.now()
  })),

  resetRetry: () => set({ retryCount: 0, lastRetryTime: null }),

  toggleOfflineMode: async () => {
    try {
      const db = getFirebaseDb();
      const { firestoreConnected } = get();

      if (firestoreConnected) {
        await disableNetwork(db);
        set({ firestoreConnected: false });
        console.log('Switched to offline mode');
      } else {
        await enableNetwork(db);
        set({ firestoreConnected: true });
        console.log('Switched to online mode');
      }
    } catch (error) {
      console.error('Failed to toggle offline mode:', error);
      set({ connectionError: 'Failed to toggle connection mode' });
    }
  }
}));

// Monitor online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network connection restored');
    useConnectionStore.getState().setOnline(true);
    useConnectionStore.getState().resetRetry();
  });

  window.addEventListener('offline', () => {
    console.log('Network connection lost');
    useConnectionStore.getState().setOnline(false);
    useConnectionStore.getState().setConnectionError('No internet connection');
  });
}

// Export helper to check overall connection health
export const isFullyConnected = () => {
  const state = useConnectionStore.getState();
  return state.isOnline && state.firebaseConnected && state.authConnected;
};

// Export helper to check if we should retry
export const shouldRetryConnection = () => {
  const state = useConnectionStore.getState();
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 30000; // 30 seconds

  if (state.retryCount >= MAX_RETRIES) return false;
  if (!state.lastRetryTime) return true;

  return Date.now() - state.lastRetryTime > RETRY_DELAY;
};