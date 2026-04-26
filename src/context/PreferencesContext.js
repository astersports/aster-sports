import { createContext } from 'react';

export const PreferencesContext = createContext({
  preferences: null,
  loading: true,
  error: null,
  updatePreference: async () => {},
  mergePreferenceJson: async () => {},
});
