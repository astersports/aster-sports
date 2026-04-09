import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const SKYFIRE_DEFAULTS = {
  header: '#151525',
  accent: '#C9952E',
  accent_hover: '#D4A843',
  text_on_dark: '#F5F0E8',
};

function applyBrandColors(brandColors) {
  const colors = brandColors || {};
  const root = document.documentElement;
  root.style.setProperty('--sf-header', colors.header || SKYFIRE_DEFAULTS.header);
  root.style.setProperty('--sf-accent', colors.accent || SKYFIRE_DEFAULTS.accent);
  root.style.setProperty('--sf-accent-hover', colors.accent_hover || SKYFIRE_DEFAULTS.accent_hover);
  root.style.setProperty('--sf-text-on-dark', colors.text_on_dark || SKYFIRE_DEFAULTS.text_on_dark);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  const fetchRoleAndOrg = useCallback(async (userId) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, organization_id, organizations(id, name, slug, brand_colors)')
        .eq('user_id', userId)
        .single();

      if (id !== fetchIdRef.current) return; // stale request

      if (error) {
        console.error('Error fetching role:', error.message);
        setUserRole(null);
        setOrganization(null);
        applyBrandColors(null);
      } else {
        setUserRole(data.role);
        const org = data.organizations ?? null;
        setOrganization(org);
        applyBrandColors(org?.brand_colors);
      }
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      console.error('Failed to fetch role:', err);
      setUserRole(null);
      setOrganization(null);
      applyBrandColors(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRoleAndOrg(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) fetchRoleAndOrg(session.user.id);
        else {
          setUserRole(null);
          setOrganization(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchRoleAndOrg]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
    setSession(null);
    setUserRole(null);
    setOrganization(null);
    applyBrandColors(null);
  }, []);

  const value = useMemo(
    () => ({ session, userRole, organization, loading, signIn, signOut }),
    [session, userRole, organization, loading, signIn, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
