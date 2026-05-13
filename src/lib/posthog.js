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
//   property_denylist: [...]         — strip SDK auto-attached non-geo fields
//                                      (URL, path, UA, device, viewport, UTM,
//                                      click IDs, plus $initial_ mirrors).
//                                      Geo ($geoip_*) is intentionally NOT
//                                      stripped here — server-enriched at
//                                      ingest, see CLAUDE.md §16.7.1
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

// SDK-attached auto-capture properties we strip before transport. posthog-js
// adds these client-side; the denylist runs before the outbound payload leaves
// the browser. NOT a fix for server-enriched fields like $geoip_* — those are
// added at ingest, after the SDK's payload arrives. See CLAUDE.md §16.7.1 for
// the two-surface enrichment principle.
const PROPERTY_DENYLIST = [
  // URL, path, referrer (event + $initial_ mirror)
  '$current_url', '$pathname', '$host', '$referrer', '$referring_domain',
  '$initial_current_url', '$initial_pathname', '$initial_host',
  '$initial_referrer', '$initial_referring_domain',
  // Browser, OS, device, viewport, screen
  '$raw_user_agent', '$browser', '$browser_version', '$os', '$os_version',
  '$device_type', '$screen_width', '$screen_height',
  '$viewport_width', '$viewport_height',
  '$initial_raw_user_agent', '$initial_browser', '$initial_browser_version',
  '$initial_os', '$initial_os_version', '$initial_device_type',
  '$initial_screen_width', '$initial_screen_height',
  '$initial_viewport_width', '$initial_viewport_height',
  // UTM
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  '$initial_utm_source', '$initial_utm_medium', '$initial_utm_campaign',
  '$initial_utm_term', '$initial_utm_content',
  // Click IDs (ad networks, affiliate, partner clicks)
  'gclid', 'fbclid', 'dclid', 'gbraid', 'igshid', 'irclid', 'mc_cid',
  'ttclid', 'twclid', 'wbraid', 'msclkid', 'rdt_cid', 'li_fat_id',
  'epik', 'qclid', 'sccid', '_kx', 'gad_source', 'gclsrc',
  '$initial_gclid', '$initial_fbclid', '$initial_dclid', '$initial_gbraid',
  '$initial_igshid', '$initial_irclid', '$initial_mc_cid', '$initial_ttclid',
  '$initial_twclid', '$initial_wbraid', '$initial_msclkid', '$initial_rdt_cid',
  '$initial_li_fat_id', '$initial_epik', '$initial_qclid', '$initial_sccid',
  '$initial__kx', '$initial_gad_source', '$initial_gclsrc',
];

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
    property_denylist: PROPERTY_DENYLIST,
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
