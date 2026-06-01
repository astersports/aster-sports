// Ember brand defaults. Used pre-auth and as fallback when org branding is missing.
// These map 1:1 to the canonical brand_colors jsonb keys defined in the
// Ember tenancy architecture doc section 5.

export const EMBER_BRAND = Object.freeze({
  accent: '#D4AF37',
  accent_hover: '#E8C75C',
  accent_soft: 'rgba(212,175,55,0.1)',
  header: '#151525',
  text_on_dark: '#F5F0E8',
});

export const EMBER_DISPLAY_NAME = 'Vela';

// Maps brand_colors jsonb keys to CSS variable names.
// Used by useOrgBranding to apply or clear org overrides.
export const BRAND_CSS_VAR_MAP = Object.freeze({
  accent: '--em-accent',
  accent_hover: '--em-accent-hover',
  accent_soft: '--em-accent-soft',
  header: '--em-header',
  text_on_dark: '--em-text-on-dark',
});
