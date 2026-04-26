import { Bell, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EMBER_DISPLAY_NAME } from '../../lib/emberDefaults';

// Top app bar: org initial + name on the left, notification bell on the right.
// Org logo is a future enhancement — for now we always render the initial
// circle because no org stores a logo URL yet.
export default function Header() {
  const { org, orgName } = useAuth();
  const navigate = useNavigate();
  // Future: read unread count from a notifications query. Hardcoded to 0 for
  // now so the dot stays hidden until that feature lands.
  const unread = 0;

  // Total rendered height = 56px of content + env(safe-area-inset-top).
  // On a notched iPhone, the inset pushes the content row below the notch
  // while the blue background extends behind it; on devices with no inset
  // the header collapses to exactly 56px. `flex-shrink: 0` + explicit
  // min/max height keep the row from ever growing past its content area
  // if a future parent uses flex-grow or similar.
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-4"
      style={{
        height: 'calc(56px + env(safe-area-inset-top, 0px))',
        minHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
        maxHeight: 'calc(56px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        flexShrink: 0,
        background: 'linear-gradient(180deg, var(--em-header) 0%, color-mix(in srgb, var(--em-header) 85%, black) 100%)',
        color: 'var(--em-text-on-dark)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <img
          src={org?.logo_url || '/phoenix.webp'}
          onError={(e) => { if (e.currentTarget.src.endsWith('/phoenix.webp')) return; e.currentTarget.src = '/phoenix.webp'; }}
          alt=""
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div
          className="truncate font-semibold"
          style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}
          title={orgName || ''}
        >
          {org ? orgName : EMBER_DISPLAY_NAME}
        </div>
      </div>
      <button
        type="button"
        className="relative flex items-center justify-center sf-press"
        style={{ width: 44, height: 44, color: 'var(--em-text-on-dark)' }}
        aria-label="Notifications"
      >
        <div className="sf-bell-shake" style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.1)',
        }}>
          <Bell size={22} strokeWidth={1.75} />
        </div>
        {unread > 0 && (
          <span
            className="absolute"
            style={{
              top: 10,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'var(--em-danger)',
            }}
            aria-label={`${unread} unread notifications`}
          />
        )}
      </button>
      <button
        type="button"
        onClick={() => navigate('/account')}
        className="sf-press flex items-center justify-center"
        style={{ width: 44, height: 44, color: 'var(--em-text-on-dark)', background: 'none', border: 'none' }}
        aria-label="Account"
      >
        <Settings size={20} strokeWidth={1.75} />
      </button>
    </header>
  );
}
