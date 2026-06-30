import { useEffect, useState } from 'react';
import { isTeamTracked, toggleTrackedTeam, TRACKED_CHANGE_EVENT } from '../../lib/aau/trackingStore';

// ☆ Track / ★ Tracked toggle for the no-login Hub (R1·PR-A). Persists to the
// anon localStorage tracking store; reflects state across every mounted button.
// --as-* tokens only, 44px tap target, aria-pressed for screen readers.
export default function AauTrackButton({ teamKey, name }) {
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!teamKey) return undefined;
    const sync = () => setTracked(isTeamTracked(teamKey));
    sync();
    window.addEventListener(TRACKED_CHANGE_EVENT, sync);
    return () => window.removeEventListener(TRACKED_CHANGE_EVENT, sync);
  }, [teamKey]);

  if (!teamKey) return null;

  return (
    <button
      type="button"
      onClick={() => toggleTrackedTeam({ teamKey, name })}
      aria-pressed={tracked}
      aria-label={tracked ? `Stop tracking ${name || 'this team'}` : `Track ${name || 'this team'}`}
      style={{
        minHeight: 44, padding: '0 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        color: tracked ? 'var(--as-text-inverse)' : 'var(--as-accent)',
        // Tracked uses the signature gold→flame gradient (existing tokens) for pop.
        background: tracked ? 'linear-gradient(135deg, var(--as-flame-mid), var(--as-accent))' : 'var(--as-bg-card)',
        border: `1px solid ${tracked ? 'var(--as-accent)' : 'var(--as-border-default)'}`,
      }}
    >
      {tracked ? '★ Tracked' : '☆ Track'}
    </button>
  );
}
