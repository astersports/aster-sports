// Route memory — persists the last visited route across PWA cold-launch.
//
// Problem: the PWA manifest's `start_url` is `/`, so when iOS Safari kills
// a backgrounded PWA and the user re-taps the home-screen icon, the page
// loads at `/` regardless of where they left off. Backing out of a half-
// finished briefing draft, an event detail page, etc. forces them to find
// their way back manually — and any in-React state has already evaporated.
//
// Strategy:
//   - On every `visibilitychange:hidden` and `pagehide`, write the current
//     pathname + search to localStorage with a timestamp.
//   - On app mount, if landing on `/` AND a saved route exists AND it's
//     recent (< 30 min) AND it isn't `/` itself, redirect to the saved
//     route with { replace: true } before any page renders. Then CLEAR
//     the saved route so an explicit later visit to `/` doesn't bounce.
//
// Auth interaction: useRouteMemory fires before AuthContext resolves, but
// the redirect target is wrapped by RequireAuth — if the user isn't
// authed, RequireAuth catches it and the post-login redirect handles the
// rest. No interference.

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'em:lastRoute';
const TTL_MS = 30 * 60 * 1000;

export function useRouteMemory() {
  const location = useLocation();
  const navigate = useNavigate();

  // One-shot restore on first mount.
  useEffect(() => {
    if (location.pathname !== '/') return;
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); }
    catch { return; }
    if (!raw) return;
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { localStorage.removeItem(STORAGE_KEY); return; }
    const { path, time } = parsed || {};
    if (!path || path === '/' || typeof time !== 'number') {
      localStorage.removeItem(STORAGE_KEY); return;
    }
    if (Date.now() - time > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY); return;
    }
    localStorage.removeItem(STORAGE_KEY);
    navigate(path, { replace: true });
    // Intentionally no deps — fire exactly once on mount. The restore is
    // a cold-launch behavior, not a navigation behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist current route on hide/pagehide.
  useEffect(() => {
    const persist = () => {
      try {
        const path = location.pathname + (location.search || '');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ path, time: Date.now() }));
      } catch { /* quota or private mode — silent */ }
    };
    const onVisChange = () => { if (document.visibilityState === 'hidden') persist(); };
    document.addEventListener('visibilitychange', onVisChange);
    window.addEventListener('pagehide', persist);
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      window.removeEventListener('pagehide', persist);
    };
  }, [location.pathname, location.search]);
}
