import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN;
const ENV = import.meta.env.MODE;

export function initSentry() {
  if (!DSN) {
    console.log('Sentry DSN not set; error tracking disabled');
    return;
  }
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      // Drop user-cancelled Web Share API calls. navigator.share() rejects
      // with AbortError when the user dismisses the share sheet — that's
      // expected platform behavior, not a bug. Sentry JAVASCRIPT-REACT-2.
      const ex = event.exception?.values?.[0];
      if (ex?.type === 'AbortError' && /share/i.test(ex?.value || '')) return null;
      if (event.contexts?.state?.user?.email) delete event.contexts.state.user.email;
      if (event.contexts?.state?.user?.phone) delete event.contexts.state.user.phone;
      // Defense-in-depth: strip server-derived geo + IP from event.user.
      // Sentry enriches these at ingest from the request IP, AFTER beforeSend
      // runs in our config (sendDefaultPii: false is the @sentry/react v8+
      // default), so this is a no-op today. Activates if sendDefaultPii is
      // ever flipped to true, at which point the SDK attaches
      // user.{geo,ip_address} pre-transport and this strip fires.
      // See CLAUDE.md §16.7.1 for the two-surface enrichment principle.
      if (event.user) {
        delete event.user.geo;
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

export function setSentryUser(user, role, orgId) {
  if (!DSN) return;
  Sentry.setUser({ id: user?.id, role, org_id: orgId });
}

export function clearSentryUser() {
  if (!DSN) return;
  Sentry.setUser(null);
}

// Wave 2.C #24 + AP candidate A — Sentry-side reportError target.
// Callers should NOT import this directly; use src/lib/reportError.js so the
// console.error fires synchronously and the SDK chunk stays lazy-loaded.
export function captureErrorToSentry(err, surface, extra) {
  if (!DSN) return;
  Sentry.captureException(err, { tags: { surface }, extra });
}
