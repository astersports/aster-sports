import { useCallback, useMemo } from 'react';
import { usePreferences } from './usePreferences';

const VALID = ['minimal', 'medium', 'maximum'];
const NEXT_IN_CYCLE = { minimal: 'medium', medium: 'maximum', maximum: 'minimal' };
const FALLBACK = 'medium';

/**
 * useDensity(sectionKey)
 * Per-section density hook. Reads from user_preferences.card_density JSONB.
 * Resolution: card_density[sectionKey] -> card_density.default -> 'medium'.
 */
export function useDensity(sectionKey) {
  const { preferences, loading, mergePreferenceJson } = usePreferences();

  const density = useMemo(() => {
    if (!preferences) return FALLBACK;
    const map = preferences.card_density ?? {};
    const sectionValue = map[sectionKey];
    if (VALID.includes(sectionValue)) return sectionValue;
    const defaultValue = map.default;
    if (VALID.includes(defaultValue)) return defaultValue;
    return FALLBACK;
  }, [preferences, sectionKey]);

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
