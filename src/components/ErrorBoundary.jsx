import { Component } from 'react';
import * as Sentry from '@sentry/react';

// Recognizes stale-bundle chunk-load failures. After a Vercel deploy
// rotates content-hashed chunk filenames, a PWA-cached index.html
// (or just an open tab from before the deploy) can reference chunks
// that no longer exist on the CDN. React.lazy() throws ChunkLoadError;
// without the auto-reload below, users see the "Something went wrong"
// fallback and have to tap Refresh manually.
function isChunkLoadError(error) {
  if (!error) return false;
  const msg = String(error.message || error || '');
  return (
    error.name === 'ChunkLoadError'
    || /Loading chunk \d+ failed/i.test(msg)
    || /Failed to fetch dynamically imported module/i.test(msg)
    || /Importing a module script failed/i.test(msg)
  );
}

// Root-level error boundary. Catches synchronous render errors anywhere
// below it and shows a refresh prompt instead of a white screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Wire Sentry so future occurrences surface (previously errors
    // logged only to console.error — Sentry showed zero RecordsPage
    // errors despite Frank reporting the fallback rendering).
    try { Sentry.captureException(error, { extra: errorInfo }); } catch { /* don't double-fault */ }
    // Auto-reload on stale chunks. One-shot guard via sessionStorage
    // so we don't loop if the new bundle also throws.
    if (isChunkLoadError(error)) {
      const flag = 'sf:chunk-reload-attempted';
      if (!sessionStorage.getItem(flag)) {
        sessionStorage.setItem(flag, '1');
        window.location.reload();
      }
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="sf-fullscreen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--em-bg-page)' }}
      >
        <div className="text-center">
          <h1
            className="font-semibold"
            style={{ color: 'var(--em-text-primary)', fontSize: 20, marginBottom: 8 }}
          >
            Something went wrong
          </h1>
          <p style={{ color: 'var(--em-text-secondary)', fontSize: 15, marginBottom: 16 }}>
            Please try refreshing the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-semibold sf-press"
            style={{
              minHeight: 44,
              padding: '0 20px',
              borderRadius: 10,
              backgroundColor: 'var(--em-accent)',
              color: 'var(--em-text-inverse)',
              fontSize: 15,
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}
