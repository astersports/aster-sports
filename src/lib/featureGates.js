// THE ONE GATE CHAIN (design system D3, amended round 6; full-surface
// audit 2026-06-12 F-5). Rides surface ANYWHERE ⟺ the org toggle is ON
// (organizations.feature_settings.rides_enabled, Settings → Events →
// Event features) AND the event's wizard flag is ON (events.enable_rides).
// Volunteers gate on the org toggle only — no per-event flag exists.
// Defaults are ON (`!== false`) so a missing jsonb key never dark-ships
// a feature off. EVERY reader — card facts, detail sections, home signal
// hooks, future chips — derives from these two functions; raw reads of
// feature_settings.rides_enabled / .enable_rides outside the allowlist
// fail featureGates.test.js (the AP#43 static gate).

export function ridesEnabledFor(org, event) {
  return org?.feature_settings?.rides_enabled !== false && event?.enable_rides === true;
}

export function dutiesEnabledFor(org) {
  return org?.feature_settings?.duties_enabled !== false;
}
