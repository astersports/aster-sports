import { useEffect } from 'react';
import { BRAND_CSS_VAR_MAP, EMBER_BRAND } from '../lib/emberDefaults';
import { setCachedBrandColors } from '../lib/orgBrandingCache';

// Validates a hex color string. Accepts #RGB, #RRGGBB, or rgba(...) format.
// Returns true if the value is safe to inject as a CSS variable.
function isValidColor(value) {
  if (typeof value !== 'string') return false;
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(value)) return true;
  if (/^rgba?\(\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*(,\s*[0-9.]+\s*)?\)$/i.test(value)) return true;
  return false;
}

// Applies an org's brand_colors jsonb to the documentElement as CSS variables.
// Safe against missing keys, malformed colors, and null org.
//
// Per Ember tenancy architecture doc section 4 (auth flow) + section 5 (CSS var map).
//
// On unmount or when org changes to null, all overrides are removed and the
// document falls back to defaults defined in index.css (currently Ember amber,
// will become Ember gold once index.css is updated in step 9).
export function useOrgBranding(org) {
  useEffect(() => {
    if (!org || !org.brand_colors) {
      return undefined;
    }

    const root = document.documentElement;
    const appliedKeys = [];

    Object.entries(BRAND_CSS_VAR_MAP).forEach(([jsonKey, cssVar]) => {
      const value = org.brand_colors[jsonKey];
      if (value && isValidColor(value)) {
        root.style.setProperty(cssVar, value);
        appliedKeys.push(cssVar);
      } else if (value) {
        // Malformed color value, log and skip
        if (typeof console !== 'undefined') {
          console.warn(`useOrgBranding: skipping invalid color for ${jsonKey}:`, value);
        }
      }
    });

    // Cache the applied brand_colors so next boot's main.jsx can
    // apply them synchronously before React mounts (brand-flash fix).
    setCachedBrandColors(org.brand_colors);

    return () => {
      appliedKeys.forEach((cssVar) => root.style.removeProperty(cssVar));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on org.id to avoid re-apply on object identity churn
  }, [org?.id]);
}

// Convenience export for components that need the Ember defaults synchronously.
export { EMBER_BRAND };
