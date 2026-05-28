// @vitest-environment jsdom
//
// LoginPage brand-reset invariant — cross-surface invariant test per
// anti-pattern #43.
//
// Background: `src/lib/orgBrandingCache.js` applies cached org brand
// colors synchronously pre-mount (main.jsx, before React mounts). When
// a signed-out user navigates to /login, the previously-cached org
// colors flash on the page until LoginPage's useEffect resets them to
// Ember defaults on first paint. The reset is documented in
// CLAUDE.md §4 ("LoginPage MUST reset brand tokens to Ember defaults
// on mount so the login always shows dark navy regardless of cached
// org colors") and in orgBrandingCache.js itself ("LoginPage's
// explicit reset to Ember defaults remains the source of truth for
// the /login surface").
//
// This test pins that behavior. The route-aware orgBrandingCache fix
// (skip apply when URL starts with /login or /forgot-password) is
// deferred to a follow-up arc — this invariant locks the current
// behavior so the follow-up has a clear before/after pinning. If
// anyone removes or breaks the reset, CI catches the brand-flash
// regression before it ships.
//
// Ember default values asserted here are the canonical brand
// tokens defined in CLAUDE.md §3 ("Brand (Ember defaults —
// overridden per org at runtime)").

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ signIn: vi.fn() }),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

// LoginForm is a presentational child — render-irrelevant to the
// brand-reset assertion, so stub it to keep the test focused.
vi.mock('../../components/auth/LoginForm', () => ({
  default: () => null,
}));

import LoginPage from '../LoginPage';

// Canonical Ember defaults from CLAUDE.md §3. If these ever change,
// CLAUDE.md and LoginPage.jsx must change together — this test pins
// the linkage.
const EMBER_DEFAULTS = {
  '--em-header': '#151525',
  '--em-accent': '#C9952E',
  '--em-accent-hover': '#D4A843',
  '--em-accent-soft': 'rgba(201,149,46,0.1)',
  '--em-text-on-dark': '#F5F0E8',
};

// Simulated stale-cache values that orgBrandingCache.applyCachedBrandColorsSync
// would have set on documentElement before LoginPage mounts. The Legacy
// Hoopers cobalt overrides from CLAUDE.md §3 are the realistic stale
// state for any returning parent who signed out.
const STALE_ORG_COLORS = {
  '--em-header': '#4a8fd4',
  '--em-accent': '#4a8fd4',
  '--em-accent-hover': '#5BA0E0',
  '--em-accent-soft': 'rgba(74,143,212,0.1)',
  '--em-text-on-dark': '#FFFFFF',
};

function withRouter(node) {
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

describe('LoginPage brand-reset invariant', () => {
  beforeEach(() => {
    // Pre-populate documentElement with stale org colors to simulate
    // orgBrandingCache having applied them pre-mount.
    const root = document.documentElement;
    Object.entries(STALE_ORG_COLORS).forEach(([cssVar, value]) => {
      root.style.setProperty(cssVar, value);
    });
  });

  afterEach(() => {
    document.documentElement.style.cssText = '';
    cleanup();
  });

  it('resets --em-header to Ember default on mount', () => {
    withRouter(<LoginPage />);
    expect(
      document.documentElement.style.getPropertyValue('--em-header'),
    ).toBe(EMBER_DEFAULTS['--em-header']);
  });

  it('resets --em-accent to Ember default on mount', () => {
    withRouter(<LoginPage />);
    expect(
      document.documentElement.style.getPropertyValue('--em-accent'),
    ).toBe(EMBER_DEFAULTS['--em-accent']);
  });

  it('resets --em-accent-hover to Ember default on mount', () => {
    withRouter(<LoginPage />);
    expect(
      document.documentElement.style.getPropertyValue('--em-accent-hover'),
    ).toBe(EMBER_DEFAULTS['--em-accent-hover']);
  });

  it('resets --em-accent-soft to Ember default on mount', () => {
    withRouter(<LoginPage />);
    expect(
      document.documentElement.style.getPropertyValue('--em-accent-soft'),
    ).toBe(EMBER_DEFAULTS['--em-accent-soft']);
  });

  it('resets --em-text-on-dark to Ember default on mount', () => {
    withRouter(<LoginPage />);
    expect(
      document.documentElement.style.getPropertyValue('--em-text-on-dark'),
    ).toBe(EMBER_DEFAULTS['--em-text-on-dark']);
  });

  it('overwrites all 5 stale brand tokens in a single mount (no partial reset)', () => {
    withRouter(<LoginPage />);
    const root = document.documentElement;
    Object.entries(EMBER_DEFAULTS).forEach(([cssVar, expected]) => {
      expect(
        root.style.getPropertyValue(cssVar),
        `${cssVar} should reset to ${expected}`,
      ).toBe(expected);
    });
  });
});
