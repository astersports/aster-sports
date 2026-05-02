import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { autoLinkGuardian } from '../lib/autoLinkGuardian';
import { fetchParentContext } from '../lib/parentContext';
import { setSentryUser, clearSentryUser } from '../lib/sentry';
import { useOrgBranding } from '../hooks/useOrgBranding';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [role, setRole]     = useState(null);
  const [org,  setOrg]      = useState(null);
  const [myChildren, setMyChildren] = useState([]);
  const [myTeamIds, setMyTeamIdsRaw] = useState([]);
  const [guardianId, setGuardianId] = useState(null);
  const [guardianFirstName, setGuardianFirstName] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);
  const teamIdsKeyRef = useRef('');
  const setMyTeamIds = useCallback((ids) => {
    const k = [...(ids || [])].sort().join(',');
    if (k !== teamIdsKeyRef.current) { teamIdsKeyRef.current = k; setMyTeamIdsRaw(ids || []); }
  }, []);

  // Apply org brand colors to documentElement CSS variables.
  // Hook handles cleanup on org change to null.
  useOrgBranding(org);

  // Load role + org for a given auth user. Uses a ref-based token to drop
  // stale responses if auth state flips while a previous fetch is in flight.
  const loadMembership = useCallback(async (authUser) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, organization_id, organizations(id, name, display_name, slug, logo_url, brand_colors, tagline, primary_domain)')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (id !== fetchIdRef.current) return;

    let resolvedRole = null;
    let resolvedOrg = null;
    if (error) {
      console.error('Failed to load membership:', error.message);
    } else if (data) {
      resolvedRole = data.role ?? null;
      resolvedOrg = data.organizations ?? null;
    } else {
      const linked = await autoLinkGuardian(authUser);
      if (id !== fetchIdRef.current) return;
      resolvedRole = linked?.role ?? null;
      resolvedOrg = linked?.organization ?? null;
    }
    setRole(resolvedRole); setOrg(resolvedOrg);
    setSentryUser(authUser, resolvedRole, resolvedOrg?.id);

    if (resolvedRole === 'parent') {
      const ctx = await fetchParentContext(authUser.id);
      if (id !== fetchIdRef.current) return;
      setMyChildren(ctx.myChildren); setMyTeamIds(ctx.myTeamIds); setGuardianId(ctx.guardianId);
      setGuardianFirstName(ctx.guardianFirstName ?? null);
    } else if (resolvedRole === 'coach') {
      const { data: staffRows } = await supabase.from('team_staff').select('team_id').eq('user_id', authUser.id);
      if (id !== fetchIdRef.current) return;
      setMyTeamIds((staffRows || []).map((r) => r.team_id));
      setMyChildren([]); setGuardianId(null); setGuardianFirstName(null);
    } else {
      setMyChildren([]); setMyTeamIds([]); setGuardianId(null); setGuardianFirstName(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadMembership(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) loadMembership(session.user);
        else {
          setRole(null); setOrg(null);
          setMyChildren([]); setMyTeamIds([]); setGuardianId(null); setGuardianFirstName(null);
          clearSentryUser(); setLoading(false);
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
    setUser(null); setRole(null); setOrg(null);
    setMyChildren([]); setMyTeamIds([]); setGuardianId(null); setGuardianFirstName(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      orgId: org?.id ?? null,
      orgName: org?.name ?? null,
      org,
      myChildren,
      myTeamIds,
      guardianId,
      guardianFirstName,
      loading,
      signIn,
      signOut,
    }),
    [user, role, org, myChildren, myTeamIds, guardianId, guardianFirstName, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
