// Self-contained "Share schedule" affordance: a button that opens a
// BottomSheet showing a QR code + copyable link for a team's public
// schedule (/schedule/:teamId — unauthenticated, see publicUrls.js).
// Encapsulates its own sheet + state so host surfaces (TeamDetailHero,
// PublicSchedulePage) add a single element without growing past the
// 150-line cap. QR colors use the lib's black-on-white defaults for
// scan reliability (not themed).

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { publicScheduleUrl } from '../../lib/publicUrls';

export default function ShareScheduleButton({ teamId, label = 'Share', style }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!teamId) return null;
  const url = publicScheduleUrl(teamId);

  const copy = () => {
    navigator.clipboard?.writeText(url).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => { /* clipboard blocked — link is still visible to copy by hand */ },
    );
  };

  const defaultBtn = {
    flex: 1, minHeight: 44, borderRadius: 10, border: '1px solid var(--as-border-default)',
    backgroundColor: 'var(--as-bg-card)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };

  return (
    <>
      <button type="button" aria-label="Share public schedule" className="as-press"
        onClick={() => { navigator.vibrate?.(10); setOpen(true); }} style={style || defaultBtn}>
        <QrCode size={14} strokeWidth={1.75} /> {label}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} initialHeight="55%">
        <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 }}>Share schedule</h3>
        <p style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginBottom: 16 }}>
          Scan to open this team&rsquo;s public schedule — no login needed.
        </p>
        <div role="img" aria-label="QR code for the public schedule"
          style={{ display: 'flex', justifyContent: 'center', padding: 16, backgroundColor: 'var(--as-bg-card)', borderRadius: 16, border: '1px solid var(--as-border-default)' }}>
          <QRCodeSVG value={url} size={208} marginSize={2} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--as-text-secondary)', wordBreak: 'break-all', textAlign: 'center', margin: '12px 0' }}>{url}</div>
        <button type="button" onClick={copy} className="as-press"
          style={{ width: '100%', minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600 }}>
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
      </BottomSheet>
    </>
  );
}
