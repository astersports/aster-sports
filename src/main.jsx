import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesProvider';
import { SeasonProvider } from './context/SeasonContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './context/ToastProvider';
import App from './App.jsx';
import { applyCachedBrandColorsSync } from './lib/orgBrandingCache';
import './index.css';
import './styles/broadcast.css';

// Apply cached brand colors BEFORE React mounts so first paint uses
// the correct org brand instead of Ember/Ember defaults. Closes the
// brand-flash Frank captured 2026-05-20. Safe no-op when cache empty
// (first-ever login on this browser) — defaults remain.
applyCachedBrandColorsSync();

// Defer Sentry + PostHog init to idle time so they don't block first paint.
const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
idle(() => { import('./lib/sentry').then((m) => m.initSentry()).catch(() => {}); });
idle(() => { import('./lib/posthog').then((m) => m.initPosthog()).catch(() => {}); });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        {/* Wave-0 prerequisite for §17.1 perf-target enforceability — RUM
            via Vercel Speed Insights. Auto-tracks route changes; captures
            LCP/INP/FMP/CLS p75 distributions in prod. Inside BrowserRouter
            so it sees router context. */}
        <SpeedInsights />
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
