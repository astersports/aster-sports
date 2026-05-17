import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ActiveRoleProvider } from './context/ActiveRoleContext';
import { AuthProvider } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesProvider';
import { SeasonProvider } from './context/SeasonContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastProvider';
import App from './App.jsx';
import './index.css';
import './styles/broadcast.css';

// Defer Sentry + PostHog init to idle time so they don't block first paint.
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
idle(() => { import('./lib/sentry').then((m) => m.initSentry()).catch(() => {}); });
idle(() => { import('./lib/posthog').then((m) => m.initPosthog()).catch(() => {}); });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ActiveRoleProvider>
            <PreferencesProvider>
              <SeasonProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </SeasonProvider>
            </PreferencesProvider>
          </ActiveRoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
