// THE ONE GATE CHAIN (design system D3, amended round 6; full-surface
// audit 2026-06-12 F-5). Rides surface ANYWHERE ⟺ the org toggle is ON
// (organizations.feature_settings.rides_enabled, Settings → Events →
// Event features) AND the event's wizard flag is ON (events.enable_rides).
// Volunteers gate on the org toggle only — no per-event flag exists.
// Defaults are ON so a missing jsonb key never dark-ships a feature off.
// "On" means the key is absent (undefined) OR the literal boolean true;
// any other present value (false, "false", 0, null, objects) reads OFF so
// non-boolean garbage can't silently fail-OPEN a gate. EVERY reader — card
// facts, detail sections, home signal hooks, future chips — derives from
// these two functions; raw reads of feature_settings.rides_enabled /
// .enable_rides outside the allowlist fail featureGates.test.js (the AP#43
// static gate).
const orgFlagOn = (v) => v === undefined || v === true;

export function ridesEnabledFor(org, event) {
  return orgFlagOn(org?.feature_settings?.rides_enabled) && event?.enable_rides === true;
}

export function dutiesEnabledFor(org) {
  return orgFlagOn(org?.feature_settings?.duties_enabled);
}

// The org-capability HALF of the rides chain. The create/edit wizard offers
// its "Enable rides" toggle (which SETS the per-event flag) only when the org
// capability is on — otherwise the admin would flip a flag that every reader's
// ridesEnabledFor() still resolves OFF (the silent "I turned it on and nothing
// happened" bug, events-wizard L99 audit 2026-06-13 B1/D2). Mirrors the org
// half of ridesEnabledFor; keeps the raw flag read inside this allowlisted file.
export function ridesCapableOrg(org) {
  return orgFlagOn(org?.feature_settings?.rides_enabled);
}
