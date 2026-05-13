// PostHog product analytics wrapper. Mirrors the src/lib/sentry.js shape so
// AuthContext + main.jsx wire both with parallel calls.
//
// SCOPE OF THIS MODULE: SDK setup + identify only. Zero event instrumentation.
// The event taxonomy (what to capture and with what properties) is a separate
// decision that needs Frank + §16.7 review to ensure event properties never
// carry data covered by the privacy locks (per-child attendance trends,
// streaks, photo-wall content, etc.).
//
// Privacy posture per CLAUDE.md §16.7 (privacy locks always-on).
// Flags below verified against posthog-js@1.373.4 type defs — all are
// real top-level options on this SDK version. Re-verify on major bumps:
//   grep -E "<flag>" node_modules/posthog-js/dist/module.d.ts
//
//   autocapture: false               — explicit instrumentation only, no
//                                      spray-and-pray of every click + input
//   capture_pageview: false          — pageviews leak route paths like
//                                      /teams/<uuid>/events/<uuid> embedding
//                                      identifiers; explicit named events only
//   disable_session_recording: true  — full-page screen recordings on a UI
//                                      displaying minors' data is not okay
//   session_recording.masking        — defense in depth: even if recording
//                                      gets accidentally enabled later,
//                                      maskAllInputs + maskTextSelector:'*'
//                                      means inputs + ALL text are redacted
//   person_profiles: 'identified_only' — anonymous visitors don't get
//                                      persistent profiles; only authenticated
//                                      users we explicitly identify
//   defaults: '2026-01-30'           — pin defaults so PostHog's future SDK
//                                      changes don't surprise the privacy
//                                      posture
//
// NOT SET (intentional, off-by-default in this SDK):
//   web vitals       — opt-in via WebVitalsAutocapture extension; we don't
//                      load it. Lighthouse + Vercel Speed Insights cover this.
//   feature flags    — opt-in via separate API; not used yet
//
// The PostHog project key (phc_*) IS designed to be exposed client-side —
// same shape as VITE_SUPABASE_ANON_KEY and VITE_SENTRY_DSN. Access control
// happens at PostHog's API.

import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const MODE = import.meta.env.MODE;

let initialized = false;

export function initPosthog() {
  // Skip in test mode regardless of key — no analytics from CI / vitest runs.
  if (MODE === 'test') return;
  if (!KEY) {
    if (MODE === 'development') console.log('PostHog key not set; analytics disabled');
    return;
  }
  if (initialized) return;
  posthog.init(KEY, {
    api_host: HOST,
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    disable_session_recording: true,
    // Defense-in-depth: even if disable_session_recording is flipped to false
    // later (intentionally or by config drift), inputs + all text are masked.
    session_recording: {
      masking: {
        maskAllInputs: true,
        maskTextSelector: '*',
      },
    },
    loaded: () => { initialized = true; },
  });
}

// Identify the authenticated user. Mirror of setSentryUser semantics.
//
// Distinct ID is auth.uid (Supabase UUID), NOT email. Email is PII in a place
// it doesn't need to be.
//
// Properties are categorical only — role + org_id. No player names, no
// child IDs, no team-roster data. Per §16.7 those are family-private.
//
// IMPORTANT: never identify a minor. If kids ever get their own login
// (Phase 3+), this call must gate on `is_adult` or equivalent before firing.
// The next developer copying this pattern needs to know.
export function identifyPosthog(user, role, orgId) {
  if (MODE === 'test' || !KEY || !user?.id) return;
  posthog.identify(user.id, { role, org_id: orgId });
}

// Reset on signout so the next user on a shared device doesn't inherit
// identity. Also mirrors clearSentryUser semantics.
export function resetPosthog() {
  if (MODE === 'test' || !KEY) return;
  posthog.reset();
}
