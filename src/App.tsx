import { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';
import { initializeAuth } from './stores/authStore';
import { useAuthStore } from './stores/authStore';
import { NavigationBar } from './components/NavigationBar';
import { ServiceStatus } from './components/ServiceStatus';
import { NetworkErrorBoundary } from './components/NetworkErrorBoundary';

// Pages (will be created)
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { InnermostsPage } from './pages/innermosts/InnermostsPage';
import { CreateWantsPage } from './pages/wants/CreateWantsPage';
import { SelectWillingPage } from './pages/willing/SelectWillingPage';
import { WeeklyGuessPage } from './pages/scoring/WeeklyGuessPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

// Create React Query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

// Loading Spinner Component
const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-white"></div>
      </div>
    </div>
    <p className="mt-4 text-gray-600 animate-pulse">{message}</p>
  </div>
);

// Firebase Initialization Error Component
const InitializationError = ({ error }: { error: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <svg className="w-8 h-8 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-800">Initialization Error</h2>
      </div>
      <p className="text-gray-600 mb-4">{error}</p>
      <div className="space-y-2">
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Clear Data & Retry
        </button>
      </div>
    </div>
  </div>
);

// Auth Guard Component with better error handling
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, firebaseUser, isInitialized, error } = useAuthStore();
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    // Set a timeout for auth initialization
    const timer = setTimeout(() => {
      if (!isInitialized) {
        setAuthTimeout(true);
      }
    }, 15000); // 15 seconds timeout

    return () => clearTimeout(timer);
  }, [isInitialized]);

  // Show timeout error if auth takes too long
  if (authTimeout && !isInitialized) {
    return (
      <InitializationError
        error="Authentication is taking longer than expected. There might be a connection issue."
      />
    );
  }

  // Show loading state during initialization
  if (!isInitialized) {
    return <LoadingSpinner message="Initializing authentication..." />;
  }

  // Show error if there's a critical auth error
  if (error && error.includes('critical')) {
    return <InitializationError error={error} />;
  }

  // If Firebase has authenticated the user but we're still loading the profile data,
  // keep the guard in a loading state so we don't incorrectly redirect to login.
  if (firebaseUser && !user && !error) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

// Layout Component with service status
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="safe-area-top">
        {children}
      </main>
      <ServiceStatus />
    </div>
  );
};

// Suspense fallback component
const SuspenseFallback = () => <LoadingSpinner message="Loading page..." />;

function App() {
  const [initError, setInitError] = useState<string | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize auth with error handling
        await initializeAuth();
        setIsAppReady(true);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to initialize app:', error);
        }
        const message = error instanceof Error ? error.message : 'Failed to initialize application';
        setInitError(message);
        setIsAppReady(true); // Set ready even on error to show error UI
      }
    };

    // Add timeout for app initialization
    const timeoutId = setTimeout(() => {
      if (!isAppReady) {
        setInitError('Application initialization timed out');
        setIsAppReady(true);
      }
    }, 20000); // 20 seconds timeout

    initializeApp();

    return () => clearTimeout(timeoutId);
  }, []);

  // Show initialization error if present
  if (initError) {
    return <InitializationError error={initError} />;
  }

  // Show loading during initial app setup
  if (!isAppReady) {
    return <LoadingSpinner message="Starting application..." />;
  }

  // No basename needed for Vercel deployment (deploys to root domain)
  const basename = '/';

  return (
    <QueryClientProvider client={queryClient}>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Something went wrong
                  </h2>
                  <button
                    onClick={() => {
                      reset();
                      window.location.reload();
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            }
          >
            <Router basename={basename}>
              <NetworkErrorBoundary>
                <div className="App">
                  <Suspense fallback={<SuspenseFallback />}>
                    <Routes>
            {/* Public Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <AuthGuard>
                <Layout>
                  <HomePage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/innermosts" element={
              <AuthGuard>
                <Layout>
                  <InnermostsPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/innermosts/:innermostId/wants" element={
              <AuthGuard>
                <Layout>
                  <CreateWantsPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/innermosts/:innermostId/willing" element={
              <AuthGuard>
                <Layout>
                  <SelectWillingPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/innermosts/:innermostId/guess/:weekNumber?" element={
              <AuthGuard>
                <Layout>
                  <WeeklyGuessPage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/profile" element={
              <AuthGuard>
                <Layout>
                  <ProfilePage />
                </Layout>
              </AuthGuard>
            } />
            
            <Route path="/settings" element={
              <AuthGuard>
                <Layout>
                  <SettingsPage />
                </Layout>
              </AuthGuard>
            } />

            <Route path="/analytics" element={
              <AuthGuard>
                <Layout>
                  <AnalyticsPage />
                </Layout>
              </AuthGuard>
            } />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>

                  {/* Toast notifications with error handling */}
                  <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
                  />
                </div>
              </NetworkErrorBoundary>
            </Router>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </QueryClientProvider>
  );
}

export default App;
