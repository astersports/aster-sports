import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesProvider';
import { SeasonProvider } from './context/SeasonContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastProvider';
import App from './App.jsx';
import { initSentry } from './lib/sentry';
import { initPosthog } from './lib/posthog';
import './index.css';
import './styles/broadcast.css';

// Defer Sentry + PostHog `init()` calls to idle time so they don't block
// first paint. NOTE: the import statements themselves are eager — the
// modules already land in the main bundle via AuthContext's static
// imports of user-identify helpers (setSentryUser, identifyPosthog).
// A previous attempt used dynamic `import()` here to chunk-split the
// SDKs, but Rollup's INEFFECTIVE_DYNAMIC_IMPORT warning surfaced that
// the static import in AuthContext defeats the chunking. Eager-import
// + idle-init is the honest shape: SDK code in main bundle (which it
// was anyway), expensive init runs at idle.
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
idle(() => { try { initSentry(); } catch { /* swallow init failures */ } });
idle(() => { try { initPosthog(); } catch { /* swallow init failures */ } });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <PreferencesProvider>
            <SeasonProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </SeasonProvider>
          </PreferencesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
