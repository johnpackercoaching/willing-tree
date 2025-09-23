/**
 * Error handling test utilities
 * This file contains utilities to test various error scenarios
 */

export const ErrorHandlingTest = {
  // Test React component error
  throwComponentError: () => {
    throw new Error('Test component error - This should be caught by ErrorBoundary');
  },

  // Test async error
  throwAsyncError: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Test async error - This should be caught by global handlers');
  },

  // Test unhandled rejection
  createUnhandledRejection: () => {
    Promise.reject(new Error('Test unhandled rejection - This should be caught by global handlers'));
  },

  // Test network error
  simulateNetworkError: async () => {
    try {
      const response = await fetch('https://nonexistent-domain-12345.com/api');
      return response.json();
    } catch (error) {
      throw new Error(`Network error simulation: ${error}`);
    }
  },

  // Test Firebase initialization failure
  testFirebaseFailure: () => {
    // This would simulate Firebase being unavailable
    throw new Error('Firebase services unavailable - This should show initialization error');
  },

  // Get all logged errors
  getErrorLogs: () => {
    const globalErrors = JSON.parse(localStorage.getItem('globalErrors') || '[]');
    const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    return {
      global: globalErrors,
      component: errorLogs,
    };
  },

  // Clear all error logs
  clearErrorLogs: () => {
    localStorage.removeItem('globalErrors');
    localStorage.removeItem('errorLogs');
    console.log('Error logs cleared');
  },

  // Test error recovery
  testErrorRecovery: () => {
    // This simulates an error that can be recovered from
    const random = Math.random();
    if (random < 0.5) {
      throw new Error('Random error - Try again to recover');
    }
    return 'Success! Error recovery works.';
  },
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).ErrorHandlingTest = ErrorHandlingTest;
}