import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { autoLinkGuardian } from '../lib/autoLinkGuardian';
import { fetchParentContext } from '../lib/parentContext';
import { bustAllCaches } from '../lib/cacheBuster';
import { reportError } from '../lib/reportError';
// Sentry + PostHog helpers are loaded dynamically (lazy import) so the
// SDK code chunks separately from the main bundle. Pulling them in via
// `import { ... } from '../lib/sentry'` is what defeated the
// chunk-split in main.jsx historically — measured savings ~500 kB raw
// on the Vercel production build. Each call site below uses
// `import('../lib/<lib>').then((m) => m.X(...)).catch(() => {})` —
// fire-and-forget, swallows any module-load failure so the auth flow
// can't crash on a transient SDK fetch.
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
  //
  // Wave 4.8 hygiene PR #126 — exhaustive-deps compliance.
  // setMyTeamIds is a useCallback-wrapped dedupe wrapper around the raw
  // useState setter (line ~22), with empty deps so the reference is
  // stable across renders. Including it satisfies the lint rule without
  // changing behavior. Same rationale for the other two hooks below
  // (auth-state useEffect + signOut useCallback).
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
      reportError(error, { surface: 'AuthContext.loadMembership', userId: authUser.id });
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
    import('../lib/sentry')
      .then((m) => m.setSentryUser(authUser, resolvedRole, resolvedOrg?.id))
      .catch(() => { /* swallow — sentry chunk unreachable, identify is best-effort */ });
    // PostHog identify mirrors Sentry. Distinct ID = auth.uid (UUID), never email.
    // Properties stay categorical (role + org_id) — no player names, no child IDs,
    // no roster/streak data per §16.7 privacy locks.
    // FUTURE: never identify a minor. If kids ever get login (Phase 3+), gate
    // on is_adult before this call.
    import('../lib/posthog')
      .then((m) => m.identifyPosthog(authUser, resolvedRole, resolvedOrg?.id))
      .catch(() => { /* swallow — same rationale as Sentry above */ });

    if (resolvedRole === 'parent') {
      const ctx = await fetchParentContext(authUser.id);
      if (id !== fetchIdRef.current) return;
      setMyChildren(ctx.myChildren); setMyTeamIds(ctx.myTeamIds); setGuardianId(ctx.guardianId);
      setGuardianFirstName(ctx.guardianFirstName ?? null);
    } else if (resolvedRole === 'coach') {
      const { data: staffRows, error: staffErr } = await supabase.from('team_staff').select('team_id').eq('user_id', authUser.id);
      if (staffErr) { reportError(staffErr, { surface: 'AuthContext.coachTeamStaff', userId: authUser.id }); }
      if (id !== fetchIdRef.current) return;
      setMyTeamIds((staffRows || []).map((r) => r.team_id));
      setMyChildren([]); setGuardianId(null); setGuardianFirstName(null);
    } else {
      setMyChildren([]); setMyTeamIds([]); setGuardianId(null); setGuardianFirstName(null);
    }
    setLoading(false);
  }, [setMyTeamIds]);

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
          import('../lib/sentry').then((m) => m.clearSentryUser()).catch(() => {});
          import('../lib/posthog').then((m) => m.resetPosthog()).catch(() => {});
          setLoading(false);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [loadMembership, setMyTeamIds]);

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
    bustAllCaches();
    setUser(null); setRole(null); setOrg(null);
    setMyChildren([]); setMyTeamIds([]); setGuardianId(null); setGuardianFirstName(null);
  }, [setMyTeamIds]);

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
