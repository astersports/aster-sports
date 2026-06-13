import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// `navigate(-1)` is a silent no-op when the current page is the FIRST history
// entry — i.e. the app was opened cold ON this page: a notification/share
// deep link, a PWA cold-start, or a hard reload. The back button then does
// nothing and the user is stuck (operator-caught 2026-06-13 on an event
// detail opened from a tournament link).
//
// react-router's BrowserRouter stores an incrementing `idx` on
// window.history.state; idx > 0 means there IS an in-app entry to pop. When
// there isn't, fall back to a sensible in-app route (default: Home, which
// always exists and role-routes) instead of dead-ending.
export function useGoBack(fallback = '/') {
  const navigate = useNavigate();
  return useCallback(() => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
