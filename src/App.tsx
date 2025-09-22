import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { initializeAuth } from './stores/authStore';
import { useAuthStore } from './stores/authStore';
import { NavigationBar } from './components/NavigationBar';

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

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});

// Auth Guard Component
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isInitialized, error } = useAuthStore();

  // Debug logging removed

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    // Debug logging removed - error handling still occurs
  }

  if (!user) {
    // Debug logging removed
    return <Navigate to="/auth/login" replace />;
  }

  // Debug logging removed
  return <>{children}</>;
};

// Layout Component
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="safe-area-top">
        {children}
      </main>
    </div>
  );
};

function App() {
  // Debug logging removed

  useEffect(() => {
    // Debug logging removed
    // Initialize auth asynchronously - errors are handled inside initializeAuth
    initializeAuth();
  }, []);

  // Debug logging removed

  // Use basename only in production (GitHub Pages)
  const basename = import.meta.env.PROD ? '/willing-tree' : '/';
  // Debug logging removed
  
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename={basename}>
        <div className="App">
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
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Toast notifications */}
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
      </Router>
    </QueryClientProvider>
  );
}

export default App;
