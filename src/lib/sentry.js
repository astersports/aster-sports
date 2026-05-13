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
