// Wave 3.14 — game-day mode wrapper.
//
// 2026-05-20 — Frank-flagged on iPad screenshot: auto-expanded
// ArrivalBoard during the 4h game-day window took ~1500px for a
// 14-kid team. Per L99 event detail redesign PR A: NEVER auto-expand.
// Always-collapsed toggle with summary subtitle ("Arrival board ·
// 1/13 arrived · 3h to tip") so the state is visible without
// expanding. Coach taps to expand on tryout days.
//
// Also gated on isGameType — practices stop seeing this entirely
// (no arrival board concept for practices).

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ArrivalBoard from '../gameday/ArrivalBoard';
import Button from '../shared/Button';
import { useEventTimeWindow } from '../../hooks/useEventTimeWindow';
import { useEventArrivals } from '../../hooks/useEventArrivals';
import { useRoster } from '../../hooks/useRoster';
import { useNow } from '../../hooks/useNow';
import { LIVE_GAME_WINDOW_AFTER_MS } from '../../lib/eventWindows';

const wrap = { margin: '12px 16px' };
const toggleStyle = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 56, width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px dashed var(--em-border-default)', backgroundColor: 'var(--em-bg-card-hover)', color: 'var(--em-text-secondary)', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' };
const labelStyle = { fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' };
const subStyle = { fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2 };

function tipSubtitle(event, now) {
  const startMs = new Date(event.start_at).getTime();
  const msUntil = startMs - now;
  const msAfter = now - startMs;
  if (msAfter > 0 && msAfter < LIVE_GAME_WINDOW_AFTER_MS) return 'Live';
  if (msUntil <= 0) return '';
  const m = Math.floor(msUntil / 60000);
  if (m < 60) return `${m}m to tip`;
  const h = Math.floor(m / 60);
  return `${h}h to tip`;
}

export default function GameDayMode({ event, isStaff, isGameType }) {
  const navigate = useNavigate();
  const { isPast } = useEventTimeWindow(event);
  const [open, setOpen] = useState(false);
  const showLiveScore = isStaff && isGameType && !isPast && event.status !== 'cancelled' && event.team_id;
  const { arrivals } = useEventArrivals(event?.id);
  const { players } = useRoster(event?.team_id);
  const now = useNow();

  if (!event?.team_id) return null;
  // Practices, custom events, etc. have no arrival-board concept.
  if (!isGameType) return null;
  if (isPast) return null;

  const arrived = (arrivals || []).filter((a) => a.status === 'arrived').length;
  const total = players?.length || 0;
  const tip = tipSubtitle(event, now);
  const subtitle = total > 0
    ? `${arrived}/${total} arrived${tip ? ` · ${tip}` : ''}`
    : tip;

  if (!open) {
    return (
      <div style={wrap}>
        <button type="button" className="em-press" style={toggleStyle} onClick={() => setOpen(true)} aria-expanded={false}>
          <ChevronRight size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Arrival board</div>
            <div style={subStyle}>{subtitle || 'Tap to view player arrivals'}</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <button type="button" className="em-press" style={{ ...toggleStyle, marginBottom: 8 }} onClick={() => setOpen(false)} aria-expanded>
        <ChevronDown size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
        <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>Hide arrival board</span>
      </button>
      <ArrivalBoard event={event} />
      {showLiveScore && (
        <Button onClick={() => navigate(`/events/${event.id}/live`)} style={{ width: '100%', marginTop: 12 }}>Live Score</Button>
      )}
    </div>
  );
}
