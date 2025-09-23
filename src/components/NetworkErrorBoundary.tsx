import { useState, useEffect, ReactNode } from 'react';

interface NetworkErrorBoundaryProps {
  children: ReactNode;
}

export const NetworkErrorBoundary = ({ children }: NetworkErrorBoundaryProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineWarning(false);
      console.log('Network connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineWarning(true);
      console.log('Network connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial connection status
    if (!navigator.onLine) {
      setShowOfflineWarning(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Detect slow network
  useEffect(() => {
    if ('connection' in navigator && 'effectiveType' in (navigator as any).connection) {
      const connection = (navigator as any).connection;

      const handleConnectionChange = () => {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          console.warn('Slow network detected:', effectiveType);
        }
      };

      connection.addEventListener('change', handleConnectionChange);
      handleConnectionChange(); // Check initial state

      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);

  return (
    <>
      {children}

      {/* Offline Warning Banner */}
      {showOfflineWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
              </svg>
              <span className="font-medium">
                {isOnline ? 'Connection restored' : 'You are currently offline'}
              </span>
              <span className="ml-2 text-sm opacity-90">
                {isOnline
                  ? 'Your changes will now be synced.'
                  : 'Some features may be limited.'}
              </span>
            </div>
            <button
              onClick={() => setShowOfflineWarning(false)}
              className="text-white hover:text-red-100 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Auto-hiding success notification when coming back online */}
      {isOnline && showOfflineWarning && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            Connection restored
          </div>
        </div>
      )}
    </>
  );
};