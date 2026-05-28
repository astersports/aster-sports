// Brand-flash mitigation — caches the most-recent org's brand_colors
// in localStorage so the next app boot can apply them synchronously
// before React mounts. Without this, every boot renders Ember/Ember
// defaults until AuthContext's async fetch resolves, producing the
// brand flash Frank captured 2026-05-20 (11:49 frame).
//
// Flow:
//   1. main.jsx calls applyCachedBrandColorsSync() BEFORE createRoot
//   2. useOrgBranding writes the org's brand_colors here whenever it
//      applies them (so the cache stays current with the live org)
//   3. AuthContext.signOut → bustAllCaches() → clearCachedBrandColors
//      via the registerCacheBuster registry, preventing cross-account
//      brand bleed
//
// LoginPage's explicit reset to Ember defaults (LoginPage:37-43)
// remains the source of truth for the /login surface — that runs in
// useEffect after first paint and overrides anything the cache set.

import { BRAND_CSS_VAR_MAP } from './emberDefaults';
import { registerCacheBuster } from './cacheBuster';

const CACHE_KEY = 'ember:cached-brand-colors';

function isValidColor(value) {
  if (typeof value !== 'string') return false;
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) return true;
  if (/^rgba?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*(,\s*[0-9.]+\s*)?\)$/i.test(value)) return true;
  return false;
}

export function setCachedBrandColors(brandColors) {
  if (!brandColors || typeof brandColors !== 'object') return;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(brandColors)); } catch { /* quota / disabled — swallow */ }
}

export function clearCachedBrandColors() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* swallow */ }
}

// Read the cached brand_colors object. Returns null on any failure
// (missing, corrupt JSON, unavailable storage). Test helper too.
export function getCachedBrandColors() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

// Synchronously applies cached brand colors to documentElement.
// Designed for main.jsx pre-render call. Safe against missing
// document, missing cache, malformed JSON, and invalid color values
// — the validator gate matches useOrgBranding.js to keep the two
// application paths in sync.
export function applyCachedBrandColorsSync() {
  if (typeof document === 'undefined') return;
  const cached = getCachedBrandColors();
  if (!cached) return;
  const root = document.documentElement;
  Object.entries(BRAND_CSS_VAR_MAP).forEach(([jsonKey, cssVar]) => {
    const value = cached[jsonKey];
    if (value && isValidColor(value)) root.style.setProperty(cssVar, value);
  });
}

registerCacheBuster(clearCachedBrandColors);
