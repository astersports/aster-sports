// Calendar-subscribe BottomSheet for the public schedule page. Extracted
// from PublicSchedulePage to keep that page under the 150-line cap when
// the Share/QR affordance was added. Subscribe URLs point at the Supabase
// functions origin (team-feed), not the Vercel app origin.

import { Calendar } from 'lucide-react';
import BottomSheet from './BottomSheet';

const FEED_HOST = (() => {
  try { return new URL(import.meta.env.VITE_SUPABASE_URL).host; } catch { return null; }
})();

const calOptStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  width: '100%', minHeight: 44, padding: '0 16px', borderRadius: 10,
  border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
  color: 'var(--as-text-primary)', fontSize: 15, fontWeight: 500,
  textDecoration: 'none', marginBottom: 8,
};

// SD-16 ph1 (PR-F'): optional `feedFn` + `feedToken` generalize the
// sheet beyond team feeds — the family feed passes
// feedFn="family-feed" + the RPC-minted guardian token. Team-shape
// callers (public page) are untouched.
export default function SubscribeSheet({ open, onClose, team, feedFn = 'team-feed', feedToken, title = 'Subscribe to Calendar' }) {
  const token = feedToken ?? team?.team_feed_token;
  return (
    <BottomSheet open={open} onClose={onClose} initialHeight="30%">
      <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 16 }}>{title}</h3>
      {FEED_HOST && token ? (() => {
        const wc = `webcal://${FEED_HOST}/functions/v1/${feedFn}?token=${token}`;
        return (
          <>
            <a href={wc} style={calOptStyle} aria-label="Subscribe via Apple Calendar">
              <Calendar size={20} strokeWidth={1.75} style={{ color: 'var(--as-accent)' }} /><span>Apple Calendar</span>
            </a>
            <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(wc)}`}
              target="_blank" rel="noopener noreferrer" style={calOptStyle} aria-label="Subscribe via Google Calendar">
              <Calendar size={20} strokeWidth={1.75} style={{ color: 'var(--as-accent)' }} /><span>Google Calendar</span>
            </a>
          </>
        );
      })() : (
        <div style={{ padding: 16, color: 'var(--as-text-tertiary)', fontSize: 13, textAlign: 'center' }}>
          Subscription unavailable. Use Download Schedule (.ics) above.
        </div>
      )}
    </BottomSheet>
  );
}
