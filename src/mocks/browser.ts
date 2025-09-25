/**
 * MSW Browser Setup
 * Configures Mock Service Worker for browser environment
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Create the service worker instance
export const worker = setupWorker(...handlers);

// Configuration options
const workerOptions = {
  // Don't log requests in production
  quiet: process.env.NODE_ENV === 'production',

  // Handle unmatched requests
  onUnhandledRequest: (req: Request, print: any) => {
    // Ignore static assets and HMR requests
    const ignorePaths = [
      '/assets/',
      '/node_modules/',
      '/@vite/',
      '/@react-refresh',
      '/src/',
      '.png',
      '.jpg',
      '.svg',
      '.ico',
      '.woff',
      '.woff2',
    ];

    const shouldIgnore = ignorePaths.some(path =>
      req.url.includes(path)
    );

    if (!shouldIgnore && !req.url.includes('/api/')) {
      print.warning();
    }
  },

  // Service worker script location
  serviceWorker: {
    url: '/mockServiceWorker.js',
  },
};

// Start function with environment check
export async function startMockServiceWorker() {
  if (process.env.NODE_ENV === 'development' || process.env.VITE_USE_MOCKS === 'true') {
    try {
      await worker.start(workerOptions);
      console.log('[MSW] Mock Service Worker started successfully');

      // Add development helpers to window
      if (process.env.NODE_ENV === 'development') {
        (window as any).__msw = {
          worker,
          handlers,
          // Helper to add runtime handlers
          use: (...newHandlers: any[]) => worker.use(...newHandlers),
          // Helper to reset handlers
          reset: () => worker.resetHandlers(),
          // Helper to stop the worker
          stop: () => worker.stop(),
        };

        console.log('[MSW] Development helpers available at window.__msw');
      }

      return worker;
    } catch (error) {
      console.error('[MSW] Failed to start Mock Service Worker:', error);
      throw error;
    }
  }

  return null;
}

// Stop function
export function stopMockServiceWorker() {
  if (worker) {
    worker.stop();
    console.log('[MSW] Mock Service Worker stopped');
  }
}

// Export for use in tests
export default worker;