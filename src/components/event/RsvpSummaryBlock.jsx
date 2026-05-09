// Wave 3.14 — RSVP summary block above the fold. Color-coded counts
// matching D-RSVP-1 spec (green/amber/red). Tap to expand a per-family
// drawer. Zero-RSVP state shows muted "no RSVPs yet".

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

const wrap = { backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, padding: '14px 16px', margin: '12px 16px', boxShadow: 'var(--em-shadow-sm)' };
const headerRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', minHeight: 32, fontFamily: 'inherit', background: 'transparent', border: 'none', width: '100%', padding: 0, color: 'var(--em-text-primary)' };
const countsLine = { display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 16, fontWeight: 600 };
const sep = { color: 'var(--em-text-tertiary)', fontWeight: 400 };
const drawer = { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 };
const familyRow = { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--em-border-subtle)', fontSize: 14, color: 'var(--em-text-secondary)' };
const pillStyle = (color) => ({ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, color });

const TONE = { going: 'var(--em-success)', maybe: 'var(--em-warning)', not_going: 'var(--em-danger)' };
const LABEL = { going: 'going', maybe: 'maybe', not_going: 'out' };

function tally(rsvps) {
  const t = { going: 0, maybe: 0, not_going: 0 };
  (rsvps || []).forEach((r) => { if (t[r.response] != null) t[r.response] += 1; });
  return t;
}

export default function RsvpSummaryBlock({ rsvps, roster }) {
  const [expanded, setExpanded] = useState(false);
  const counts = useMemo(() => tally(rsvps), [rsvps]);
  const total = counts.going + counts.maybe + counts.not_going;
  const rosterMap = useMemo(() => {
    const m = new Map();
    (roster || []).forEach((p) => m.set(p.id, p));
    return m;
  }, [roster]);

  if (total === 0) {
    return (
      <div style={wrap}>
        <span style={{ fontSize: 14, color: 'var(--em-text-tertiary)' }}>no RSVPs yet</span>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <button type="button" style={headerRow} className="sf-press" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
        <span style={countsLine}>
          <span style={{ color: TONE.going }}>{counts.going} {LABEL.going}</span>
          {counts.maybe > 0 && (<><span style={sep}>·</span><span style={{ color: TONE.maybe }}>{counts.maybe} {LABEL.maybe}</span></>)}
          {counts.not_going > 0 && (<><span style={sep}>·</span><span style={{ color: TONE.not_going }}>{counts.not_going} {LABEL.not_going}</span></>)}
        </span>
        {expanded ? <ChevronDown size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" /> : <ChevronRight size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />}
      </button>
      {expanded && (
        <div style={drawer}>
          {(rsvps || []).map((r) => {
            const player = rosterMap.get(r.player_id);
            if (!player) return null;
            return (
              <div key={r.player_id} style={familyRow}>
                <span>{player.first_name} {player.last_name}</span>
                <span style={pillStyle(TONE[r.response] || 'var(--em-text-tertiary)')}>{LABEL[r.response] || r.response}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
