/* eslint-disable react-refresh/only-export-components */
// Tier 3 v1 PR 4 — active role context per Gap 6 (GitHub model).
//
// AuthContext provides `role` from user_roles (the user's primary
// role in this org). Gap 6 layers on top: users can temporarily
// "switch view" to a secondary role within a session, returning
// to primary on next session.
//
// Per Gap 6 lock:
//   - Primary role derived from permissions (admin > coach > parent
//     priority); CC currently relies on AuthContext.role which
//     resolves to a single value per user_roles row
//   - Active role = session-scoped React state, defaults to primary
//   - switchRole(role) mutates session state; persists across page
//     navigation within a session
//   - Resets on logout / new session (no localStorage)

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const ActiveRoleContext = createContext(null);

export function ActiveRoleProvider({ children }) {
  const { role: primaryRole, user } = useAuth();
  const [activeRole, setActiveRole] = useState(primaryRole);

  // When auth resolves (or changes user/role), default activeRole
  // to the new primary. This also handles logout (primary → null →
  // active → null). Microtask defer satisfies react-hooks/set-state-
  // in-effect.
  useEffect(() => {
    Promise.resolve().then(() => setActiveRole(primaryRole));
  }, [primaryRole, user?.id]);

  const switchRole = useCallback((role) => {
    if (role === 'admin' || role === 'coach' || role === 'parent' || role === null) {
      setActiveRole(role);
    }
  }, []);

  const value = useMemo(() => ({
    activeRole,
    primaryRole,
    switchRole,
    isSwitched: activeRole !== primaryRole && activeRole !== null && primaryRole !== null,
  }), [activeRole, primaryRole, switchRole]);

  return <ActiveRoleContext.Provider value={value}>{children}</ActiveRoleContext.Provider>;
}

export function useActiveRole() {
  const ctx = useContext(ActiveRoleContext);
  if (!ctx) throw new Error('useActiveRole must be used within ActiveRoleProvider');
  return ctx;
}
