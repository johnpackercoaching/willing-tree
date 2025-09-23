import { useState, useEffect } from 'react';
import { getFirebaseAuth } from '../config/firebase';

interface ServiceHealth {
  firebase: 'healthy' | 'degraded' | 'down' | 'checking';
  firestore: 'healthy' | 'degraded' | 'down' | 'checking';
  auth: 'healthy' | 'degraded' | 'down' | 'checking';
}

export const ServiceStatus = () => {
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth>({
    firebase: 'checking',
    firestore: 'checking',
    auth: 'checking',
  });
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const checkServices = async () => {
      const newHealth: ServiceHealth = {
        firebase: 'checking',
        firestore: 'checking',
        auth: 'checking',
      };

      try {
        // Check Firebase Auth
        const auth = getFirebaseAuth();
        if (auth) {
          newHealth.auth = 'healthy';
        } else {
          newHealth.auth = 'down';
        }
      } catch (error) {
        console.error('Auth service check failed:', error);
        newHealth.auth = 'down';
      }

      try {
        // Check Firestore (would need actual Firestore check)
        // For now, assume it's healthy if Firebase is initialized
        if (newHealth.auth === 'healthy') {
          newHealth.firestore = 'healthy';
        } else {
          newHealth.firestore = 'degraded';
        }
      } catch (error) {
        console.error('Firestore service check failed:', error);
        newHealth.firestore = 'down';
      }

      // Overall Firebase health
      if (newHealth.auth === 'healthy' && newHealth.firestore === 'healthy') {
        newHealth.firebase = 'healthy';
      } else if (newHealth.auth === 'down' || newHealth.firestore === 'down') {
        newHealth.firebase = 'down';
      } else {
        newHealth.firebase = 'degraded';
      }

      setServiceHealth(newHealth);

      // Show status bar if any service is not healthy
      if (newHealth.firebase !== 'healthy' ||
          newHealth.firestore !== 'healthy' ||
          newHealth.auth !== 'healthy') {
        setShowStatus(true);
      }
    };

    checkServices();

    // Re-check every 30 seconds
    const interval = setInterval(checkServices, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!showStatus) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '!';
      case 'down':
        return '✗';
      default:
        return '...';
    }
  };

  const hasIssues = Object.values(serviceHealth).some(status => status !== 'healthy');

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${hasIssues ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Service Status</h3>
          <button
            onClick={() => setShowStatus(false)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close status"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(serviceHealth).map(([service, status]) => (
            <div key={service} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">{service}</span>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)} mr-2`}></div>
                <span className="text-xs text-gray-500">{getStatusIcon(status)}</span>
              </div>
            </div>
          ))}
        </div>

        {hasIssues && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Some services may be experiencing issues. The app will continue to work with limited functionality.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-blue-500 hover:text-blue-600"
            >
              Refresh to retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
};