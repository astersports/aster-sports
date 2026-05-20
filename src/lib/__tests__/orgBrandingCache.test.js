// @vitest-environment jsdom

// Unit coverage for the brand-flash mitigation cache. Covers the
// three primary behaviors: write, read, sync-apply. The signOut →
// bustAllCaches → clearCachedBrandColors chain is covered
// indirectly via the registerCacheBuster wiring (asserting that
// importing the module registers a buster).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const CACHE_KEY = 'ember:cached-brand-colors';

describe('orgBrandingCache', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = '';
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = '';
  });

  it('setCachedBrandColors writes the brand_colors object to localStorage', async () => {
    const { setCachedBrandColors } = await import('../orgBrandingCache');
    setCachedBrandColors({ accent: '#4a8fd4', header: '#151525' });
    expect(JSON.parse(localStorage.getItem(CACHE_KEY))).toEqual({
      accent: '#4a8fd4',
      header: '#151525',
    });
  });

  it('setCachedBrandColors no-ops on falsy or non-object input', async () => {
    const { setCachedBrandColors } = await import('../orgBrandingCache');
    setCachedBrandColors(null);
    setCachedBrandColors(undefined);
    setCachedBrandColors('not-an-object');
    expect(localStorage.getItem(CACHE_KEY)).toBeNull();
  });

  it('getCachedBrandColors returns null when cache empty', async () => {
    const { getCachedBrandColors } = await import('../orgBrandingCache');
    expect(getCachedBrandColors()).toBeNull();
  });

  it('getCachedBrandColors returns null on corrupt JSON', async () => {
    localStorage.setItem(CACHE_KEY, '{not valid json');
    const { getCachedBrandColors } = await import('../orgBrandingCache');
    expect(getCachedBrandColors()).toBeNull();
  });

  it('clearCachedBrandColors removes the cached entry', async () => {
    const { setCachedBrandColors, clearCachedBrandColors, getCachedBrandColors } = await import('../orgBrandingCache');
    setCachedBrandColors({ accent: '#4a8fd4' });
    expect(getCachedBrandColors()).not.toBeNull();
    clearCachedBrandColors();
    expect(getCachedBrandColors()).toBeNull();
  });

  it('applyCachedBrandColorsSync sets CSS variables from cache', async () => {
    const { setCachedBrandColors, applyCachedBrandColorsSync } = await import('../orgBrandingCache');
    setCachedBrandColors({
      accent: '#4a8fd4',
      header: '#151525',
      text_on_dark: '#FFFFFF',
    });
    applyCachedBrandColorsSync();
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--em-accent')).toBe('#4a8fd4');
    expect(root.style.getPropertyValue('--em-header')).toBe('#151525');
    expect(root.style.getPropertyValue('--em-text-on-dark')).toBe('#FFFFFF');
  });

  it('applyCachedBrandColorsSync is a safe no-op when cache empty', async () => {
    const { applyCachedBrandColorsSync } = await import('../orgBrandingCache');
    applyCachedBrandColorsSync();
    expect(document.documentElement.style.getPropertyValue('--em-accent')).toBe('');
  });

  it('applyCachedBrandColorsSync skips invalid color values', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      accent: 'not-a-color',
      header: '#151525',
    }));
    const { applyCachedBrandColorsSync } = await import('../orgBrandingCache');
    applyCachedBrandColorsSync();
    expect(document.documentElement.style.getPropertyValue('--em-accent')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--em-header')).toBe('#151525');
  });

  it('signOut bustAllCaches chain clears the brand cache', async () => {
    const { setCachedBrandColors, getCachedBrandColors } = await import('../orgBrandingCache');
    const { bustAllCaches } = await import('../cacheBuster');
    setCachedBrandColors({ accent: '#4a8fd4' });
    expect(getCachedBrandColors()).not.toBeNull();
    bustAllCaches();
    expect(getCachedBrandColors()).toBeNull();
  });
});
