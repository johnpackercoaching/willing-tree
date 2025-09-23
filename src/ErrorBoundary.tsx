import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console with timestamp
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Application Error:`, error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);

    // Update state with error details
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to external service in production
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // This would normally send to an error tracking service
    // For now, we'll just store in localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      // Keep only last 10 errors
      const recentLogs = existingLogs.slice(-10);
      localStorage.setItem('errorLogs', JSON.stringify(recentLogs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private clearLocalStorage = () => {
    if (confirm('This will clear all local data and reload the app. Continue?')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      const isDevelopment = import.meta.env.DEV;
      const { error, errorInfo, errorCount } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Error Header */}
            <div className="bg-red-500 text-white p-6">
              <div className="flex items-center">
                <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-2xl font-bold">Something went wrong</h1>
              </div>
              <p className="mt-2 text-red-100">
                We encountered an unexpected error. The issue has been logged.
              </p>
            </div>

            {/* Error Content */}
            <div className="p-6">
              {/* User-friendly message */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  The application encountered an error and couldn't continue.
                  You can try one of the following options:
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={this.handleReload}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Reload Page
                  </button>

                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Try Again
                  </button>

                  {errorCount > 2 && (
                    <button
                      onClick={this.clearLocalStorage}
                      className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                    >
                      Clear Data & Restart
                    </button>
                  )}
                </div>

                {errorCount > 2 && (
                  <p className="mt-3 text-sm text-orange-600">
                    Multiple errors detected. Clearing data might help resolve the issue.
                  </p>
                )}
              </div>

              {/* Technical Details (Development Only or Expandable) */}
              <details className="border-t pt-4" open={isDevelopment}>
                <summary className="cursor-pointer text-gray-700 font-medium hover:text-gray-900">
                  {isDevelopment ? 'Error Details (Development Mode)' : 'Technical Details'}
                </summary>

                <div className="mt-4 space-y-4">
                  {/* Error Message */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">Error Message:</h3>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <code className="text-red-700 text-sm break-all">
                        {error?.message || 'No error message available'}
                      </code>
                    </div>
                  </div>

                  {/* Error Stack */}
                  {isDevelopment && error?.stack && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-1">Stack Trace:</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-48">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {error.stack}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Component Stack */}
                  {isDevelopment && errorInfo?.componentStack && (
                    <div>
                      <h3 className="font-semibold text-gray-700 mb-1">Component Stack:</h3>
                      <div className="bg-gray-50 border border-gray-200 rounded p-3 overflow-auto max-h-48">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="text-xs text-gray-500">
                    <p>Error Count: {errorCount}</p>
                    <p>Time: {new Date().toLocaleString()}</p>
                    <p>URL: {window.location.href}</p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}