import { useState } from 'react';
import { Bell, Eye, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useHomeRole } from '../../hooks/useHomeRole';
import { useNotificationBadge } from '../../hooks/useNotificationBadge';
import { EMBER_DISPLAY_NAME } from '../../lib/emberDefaults';
import RoleSwitcherSheet from '../RoleSwitcherSheet';

const SEVERITY_COLOR = {
  info: 'var(--em-accent)',
  warning: 'var(--em-warning)',
  danger: 'var(--em-danger)',
};

export default function Header() {
  const { org, orgName } = useAuth();
  const { activeRole, isViewingAs, canSwitchRoles } = useHomeRole();
  const { count: unread, severity } = useNotificationBadge();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleBellTap = () => navigate('/account');

  const stripeHeight = isViewingAs ? 6 : 0;

  return (
    <>
      {isViewingAs && (
        <div
          className="fixed left-0 right-0 z-50"
          style={{
            top: 'env(safe-area-inset-top, 0px)',
            height: 6,
            background: 'var(--em-warning)',
          }}
        />
      )}
      <header
        className="fixed left-0 right-0 z-40 flex items-center px-4"
        style={{
          top: `calc(env(safe-area-inset-top, 0px) + ${stripeHeight}px)`,
          height: 56,
          background: 'var(--em-header)',
          color: 'var(--em-text-on-dark)',
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={org?.logo_url || '/phoenix.webp'}
            onError={(e) => {
              if (e.currentTarget.src.endsWith('/phoenix.webp')) return;
              e.currentTarget.src = '/phoenix.webp';
            }}
            alt=""
            style={{ width: 32, height: 32, borderRadius: 8 }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-sm" title={orgName || ''}>
              {org ? orgName : EMBER_DISPLAY_NAME}
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
            style={{ color: isViewingAs ? 'var(--em-warning)' : 'inherit' }}
          >
            <Eye className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={handleBellTap}
          aria-label={unread > 0 ? `${unread} notifications` : 'Notifications'}
          className="relative w-11 h-11 flex items-center justify-center"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span
              className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{ background: SEVERITY_COLOR[severity] || SEVERITY_COLOR.info, color: 'var(--em-text-inverse)' }}
            >
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

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
