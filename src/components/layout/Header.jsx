import { useState } from 'react';
import { Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHomeRole } from '../../hooks/useHomeRole';
import { ASTER_DISPLAY_NAME } from '../../lib/asterDefaults';
import RoleSwitcherSheet from '../RoleSwitcherSheet';

// Bell removed pending Phase 2 inbox surface — see ledger §2 Cluster 4.
// Bell returns when real notification UI lands; until then settings cog
// at /account is the canonical destination. (Previous bell routed to
// /account, duplicating the settings cog with mismatched user expectation.)

export default function Header() {
  const { org, orgName } = useAuth();
  // activeRole is for label DISPLAY only — permissions use
  // useAuth().role (see RequireAuth.jsx). Do not branch behavior on
  // activeRole; if you need permission-aware Header logic, read
  // useAuth().role explicitly.
  const { activeRole, isViewingAs, canSwitchRoles } = useHomeRole();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const stripeHeight = isViewingAs ? 6 : 0;

  return (
    <>
      {isViewingAs && (
        <div
          className="fixed left-0 right-0 z-50"
          style={{
            top: 'env(safe-area-inset-top, 0px)',
            height: 6,
            background: 'var(--as-warning)',
          }}
        />
      )}
      <header
        className="fixed left-0 right-0 z-40 flex items-center px-4"
        style={{
          top: `calc(env(safe-area-inset-top, 0px) + ${stripeHeight}px)`,
          height: 56,
          background: 'var(--as-header)',
          color: 'var(--as-text-on-dark)',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={org?.logo_url || '/aster-mark.svg'}
            onError={(e) => {
              if (e.currentTarget.src.endsWith('/aster-mark.svg')) return;
              e.currentTarget.src = '/aster-mark.svg';
            }}
            alt=""
            style={{ width: 32, height: 32, borderRadius: 8 }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-sm" title={orgName || ''}>
              {org ? orgName : ASTER_DISPLAY_NAME}
            </div>
            {activeRole && (
              <div className="text-[10px] uppercase tracking-wider opacity-70 truncate">
                {isViewingAs ? `Viewing as ${activeRole}` : activeRole}
              </div>
            )}
          </div>
        </div>

        {canSwitchRoles && (
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="Switch role view"
            className="relative w-11 h-11 flex items-center justify-center"
            style={{ color: isViewingAs ? 'var(--as-warning)' : 'inherit' }}
          >
            <Eye className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => navigate('/account')}
          aria-label="Account"
          className="w-11 h-11 flex items-center justify-center"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <RoleSwitcherSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
