import { useContext } from 'react';
import { PreferencesContext } from '../context/PreferencesContext';

/**
 * usePreferences
 * Thin wrapper around PreferencesContext. State + mutators live in
 * PreferencesProvider (mounted at app root in main.jsx). All consumers
 * share the same store; writes propagate to all readers.
 */
export function usePreferences() {
  return useContext(PreferencesContext);
}
