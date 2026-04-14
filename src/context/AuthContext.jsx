import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Skyfire platform defaults. Any brand_colors key that is missing on an org
// falls back to the value here so the UI never renders without a token.
const SKYFIRE_DEFAULTS = {
  header:       '#151525',
  accent:       '#C9952E',
  accent_hover: '#D4A843',
  accent_soft:  'rgba(201, 149, 46, 0.1)',
  text_on_dark: '#F5F0E8',
};

// Mirror brand_colors onto --sf-* CSS custom properties on <html>. Called on
// login and whenever the auth listener fires — cheap, idempotent, and cleared
// back to defaults on sign out.
function applyBrandColors(brandColors) {
  const c = brandColors || {};
  const root = document.documentElement;
  root.style.setProperty('--sf-header',        c.header        || SKYFIRE_DEFAULTS.header);
  root.style.setProperty('--sf-accent',        c.accent        || SKYFIRE_DEFAULTS.accent);
  root.style.setProperty('--sf-accent-hover',  c.accent_hover  || SKYFIRE_DEFAULTS.accent_hover);
  root.style.setProperty('--sf-accent-soft',   c.accent_soft   || SKYFIRE_DEFAULTS.accent_soft);
  root.style.setProperty('--sf-text-on-dark',  c.text_on_dark  || SKYFIRE_DEFAULTS.text_on_dark);
}

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [role, setRole]     = useState(null);
  const [org,  setOrg]      = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  // Load role + org for a given auth user. Uses a ref-based token to drop
  // stale responses if auth state flips while a previous fetch is in flight.
  const loadMembership = useCallback(async (userId) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, organization_id, organizations(id, name, slug, logo_url, brand_colors)')
      .eq('user_id', userId)
      .single();
    if (id !== fetchIdRef.current) return;
    if (error) {
      console.error('Failed to load membership:', error.message);
      setRole(null);
      setOrg(null);
      applyBrandColors(null);
    } else {
      setRole(data?.role ?? null);
      setOrg(data?.organizations ?? null);
      applyBrandColors(data?.organizations?.brand_colors);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadMembership(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadMembership(session.user.id);
        else {
          setRole(null);
          setOrg(null);
          applyBrandColors(null);
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [loadMembership]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); }
    catch (err) { console.error('Sign out failed:', err); }
    setUser(null);
    setRole(null);
    setOrg(null);
    applyBrandColors(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      orgId: org?.id ?? null,
      orgName: org?.name ?? null,
      org,
      loading,
      signIn,
      signOut,
    }),
    [user, role, org, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
