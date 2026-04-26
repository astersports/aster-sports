import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from './usePreferences';
import { isAdmin, isViewAsExpired, VIEW_AS_EXPIRY_HOURS } from '../lib/permissions';

const VALID_ROLES = ['admin', 'coach', 'parent'];

/**
 * useHomeRole
 * Resolves which home variant to render: parent | coach | admin.
 * Admins can "view as" coach or parent for QA via setViewAs().
 * View-as preference auto-expires after 24h; admin can manually revert anytime.
 *
 * SCOPE: home page rendering only. Other pages use useAuth().role for
 * permissions checks. View-as is a preview affordance, not a permissions sandbox.
 *
 * Persistence shape in user_preferences.role_preferences JSONB:
 *   {
 *     preferred_home_role: 'parent' | 'coach' | 'admin' | null,
 *     preferred_home_role_set_at: ISO timestamp,
 *     view_as_guardian_id: uuid | null  (required when preferred_home_role === 'parent')
 *   }
 */
export function useHomeRole() {
  const { role: realRole, loading: authLoading } = useAuth();
  const { preferences, loading: prefsLoading, mergePreferenceJson } = usePreferences();

  const loading = authLoading || prefsLoading;
  const rolePrefs = preferences?.role_preferences ?? {};
  const preferredRole = rolePrefs.preferred_home_role ?? null;
  const preferredSetAt = rolePrefs.preferred_home_role_set_at ?? null;
  const viewAsGuardianId = rolePrefs.view_as_guardian_id ?? null;

  const canSwitchRoles = isAdmin(realRole);

  const availableRoles = useMemo(() => {
    if (!canSwitchRoles) return realRole ? [realRole] : [];
    return VALID_ROLES;
  }, [canSwitchRoles, realRole]);

  const activeRole = useMemo(() => {
    if (loading) return realRole;
    if (!canSwitchRoles) return realRole;
    if (!preferredRole) return realRole;
    if (isViewAsExpired(preferredSetAt)) return realRole;
    if (preferredRole === 'parent' && !viewAsGuardianId) return realRole;
    return preferredRole;
  }, [loading, canSwitchRoles, realRole, preferredRole, preferredSetAt, viewAsGuardianId]);

  const isViewingAs = !loading && Boolean(activeRole) && activeRole !== realRole;

  const viewAsExpiresAt = useMemo(() => {
    if (!isViewingAs || !preferredSetAt) return null;
    const setAt = new Date(preferredSetAt);
    if (Number.isNaN(setAt.getTime())) return null;
    return new Date(setAt.getTime() + VIEW_AS_EXPIRY_HOURS * 60 * 60 * 1000);
  }, [isViewingAs, preferredSetAt]);

  const setViewAs = useCallback(
    async (role, guardianId = null) => {
      if (!canSwitchRoles) {
        throw new Error('Only admins can switch home role');
      }
      if (!VALID_ROLES.includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      if (role === 'parent' && !guardianId) {
        throw new Error('Must select a guardian to view as parent');
      }
      await mergePreferenceJson('role_preferences', {
        preferred_home_role: role,
        preferred_home_role_set_at: new Date().toISOString(),
        view_as_guardian_id: role === 'parent' ? guardianId : null,
      });
    },
    [canSwitchRoles, mergePreferenceJson]
  );

  const resetToRealRole = useCallback(async () => {
    await mergePreferenceJson('role_preferences', {
      preferred_home_role: null,
      preferred_home_role_set_at: null,
      view_as_guardian_id: null,
    });
  }, [mergePreferenceJson]);

  return {
    realRole,
    activeRole,
    isViewingAs,
    canSwitchRoles,
    availableRoles,
    viewAsGuardianId,
    viewAsExpiresAt,
    setViewAs,
    resetToRealRole,
    loading,
  };
}
