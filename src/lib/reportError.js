// Wave 2.C #24 + AP candidate A — every catch path that owns a user-facing
// failure routes here, not bare console.error(). Pure console-only stays
// reserved for dev-only diagnostics.
//
// Pattern:
//   try { ... } catch (err) {
//     reportError(err, { surface: 'AuthContext.loadMembership', orgId });
//   }
//
// - `surface` (string) — short stable identifier for the catch site;
//   becomes Sentry tag `surface` for dashboard filtering.
// - Any other keys flow as Sentry `extra` context.
//
// Synchronous console.error fires immediately for dev visibility + fallback
// when the Sentry chunk is unreachable. The Sentry SDK is lazy-imported so
// the ~80KB gz chunk stays split — see context/AuthContext.jsx:6-13 for the
// chunk-split rationale (same pattern as setSentryUser / identifyPosthog).

export function reportError(err, ctx = {}) {
  const { surface = 'unknown', ...extra } = ctx;
   
  console.error(`[${surface}]`, err);
  import('./sentry')
    .then((m) => m.captureErrorToSentry?.(err, surface, extra))
    .catch(() => { /* swallow — sentry chunk unreachable, capture is best-effort */ });
}
