import { useCallback, useMemo } from 'react';
import { usePreferences } from './usePreferences';

const VALID = ['minimal', 'maximum'];
const NEXT_IN_CYCLE = { minimal: 'maximum', maximum: 'minimal' };
const FALLBACK = 'minimal';

/**
 * useDensity(sectionKey)
 * Density hook. Reads from user_preferences.card_density JSONB. 2-state
 * (minimal | maximum) per CLAUDE.md §16.2 (home-level, ratified 2026-06-05).
 * Resolution: card_density[sectionKey] -> card_density.default -> defaultDensity.
 */
export function useDensity(sectionKey, defaultDensity = FALLBACK) {
  const { preferences, loading, mergePreferenceJson } = usePreferences();

  const density = useMemo(() => {
    // Honor caller's defaultDensity in the null-preferences case too
    // (PR #308 fix). Pre-PR this path returned FALLBACK regardless of
    // what the caller passed, which silently flipped every consumer
    // to 'minimal' before user prefs loaded. Callers that pass a
    // specific default (e.g. ActionZone wants 'maximum' = rows) need
    // that honored even when preferences haven't resolved.
    if (!preferences) return VALID.includes(defaultDensity) ? defaultDensity : FALLBACK;
    const map = preferences.card_density ?? {};
    const sectionValue = map[sectionKey];
    if (VALID.includes(sectionValue)) return sectionValue;
    const defaultValue = map.default;
    if (VALID.includes(defaultValue)) return defaultValue;
    return defaultDensity;
  }, [preferences, sectionKey, defaultDensity]);

  const setDensity = useCallback(
    async (next) => {
      if (!VALID.includes(next)) {
        throw new Error(`Invalid density: ${next}. Must be one of ${VALID.join(', ')}`);
      }
      await mergePreferenceJson('card_density', { [sectionKey]: next });
    },
    [sectionKey, mergePreferenceJson]
  );

  const cycleDensity = useCallback(async () => {
    const next = NEXT_IN_CYCLE[density] ?? FALLBACK;
    await setDensity(next);
  }, [density, setDensity]);

  return {
    density,
    setDensity,
    cycleDensity,
    loading,
  };
}
