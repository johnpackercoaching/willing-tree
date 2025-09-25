import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'
import './index.css'

// Global error handlers
const isDevelopment = import.meta.env.DEV;

window.addEventListener('error', (event) => {
  if (isDevelopment) {
    console.error('Global error:', event.error);
  }
  // Log to localStorage for debugging
  try {
    const errorLog = {
      type: 'global-error',
      timestamp: new Date().toISOString(),
      message: event.error?.message || event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    };
    const logs = JSON.parse(localStorage.getItem('globalErrors') || '[]');
    logs.push(errorLog);
    localStorage.setItem('globalErrors', JSON.stringify(logs.slice(-10)));
  } catch (e) {
    if (isDevelopment) {
      console.error('Failed to log global error:', e);
    }
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (isDevelopment) {
    console.error('Unhandled promise rejection:', event.reason);
  }
  // Log to localStorage for debugging
  try {
    const errorLog = {
      type: 'unhandled-rejection',
      timestamp: new Date().toISOString(),
      reason: event.reason?.message || String(event.reason),
      stack: event.reason?.stack
    };
    const logs = JSON.parse(localStorage.getItem('globalErrors') || '[]');
    logs.push(errorLog);
    localStorage.setItem('globalErrors', JSON.stringify(logs.slice(-10)));
  } catch (e) {
    if (isDevelopment) {
      console.error('Failed to log unhandled rejection:', e);
    }
  }
});

// Function to display fallback UI when React fails to mount
function showFallbackUI(error: Error | string) {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f9fafb;
    padding: 1rem;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  container.innerHTML = `
    <div style="
      max-width: 600px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      text-align: center;
    ">
      <div style="
        width: 64px;
        height: 64px;
        background: #ef4444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
      ">
        <svg width="32" height="32" fill="white" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>

      <h1 style="
        font-size: 1.5rem;
        font-weight: bold;
        color: #111827;
        margin-bottom: 0.5rem;
      ">
        Application Failed to Start
      </h1>

      <p style="
        color: #6b7280;
        margin-bottom: 1.5rem;
        line-height: 1.5;
      ">
        The application encountered a critical error during startup and cannot continue.
        Please try refreshing the page or contact support if the problem persists.
      </p>

      <div style="margin-bottom: 1.5rem;">
        <button onclick="window.location.reload()" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          margin-right: 0.5rem;
        ">
          Reload Page
        </button>

        <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload()" style="
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
        ">
          Clear Data & Reload
        </button>
      </div>

      <details style="
        text-align: left;
        border-top: 1px solid #e5e7eb;
        padding-top: 1rem;
        margin-top: 1rem;
      ">
        <summary style="
          cursor: pointer;
          color: #6b7280;
          font-size: 0.875rem;
        ">
          Error Details
        </summary>
        <pre style="
          background: #f3f4f6;
          padding: 0.75rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          white-space: pre-wrap;
          word-break: break-all;
        ">${typeof error === 'string' ? error : (error.stack || error.message || 'Unknown error')}</pre>
      </details>
    </div>
  `;

  document.body.innerHTML = '';
  document.body.appendChild(container);
}

// Main app initialization
function initializeApp() {
  const root = document.getElementById('root');

  if (!root) {
    if (isDevelopment) {
      console.error('Critical: Root element not found!');
    }
    showFallbackUI('Root element not found. The application cannot start.');
    return;
  }

  try {
    // Attempt to create React root and render
    const reactRoot = createRoot(root);

    // Add a timeout to detect if React fails to render
    const renderTimeout = setTimeout(() => {
      // Check if React has rendered something
      if (root.children.length === 0) {
        if (isDevelopment) {
          console.error('React failed to render within timeout period');
        }
        showFallbackUI('The application failed to render. This might be due to a JavaScript error.');
      }
    }, 5000);

    reactRoot.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );

    // Clear timeout once React renders successfully
    // Use a MutationObserver to detect when React adds content
    const observer = new MutationObserver(() => {
      if (root.children.length > 0) {
        clearTimeout(renderTimeout);
        observer.disconnect();
      }
    });

    observer.observe(root, {
      childList: true,
      subtree: false
    });

  } catch (error) {
    if (isDevelopment) {
      console.error('Failed to initialize React application:', error);
    }
    showFallbackUI(error instanceof Error ? error : new Error('Failed to initialize React'));
  }
}

// Check if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already loaded
  initializeApp();
}
