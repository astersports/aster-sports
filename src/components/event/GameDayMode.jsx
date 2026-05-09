// Wave 3.14 — game-day mode wrapper. Renders ArrivalBoard + Live
// Score CTA inside an expand/collapse surface. Auto-expanded when
// within 4h before to 3h after event start. Outside that window,
// collapsed by default with a subtle "Show game-day tools" affordance.
//
// Frank's L99 feedback: "The sign in players isn't a main function."
// Game-day tools no longer dominate the page when admin opens an
// event 3 days out.

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ArrivalBoard from '../gameday/ArrivalBoard';
import Button from '../shared/Button';
import { useEventTimeWindow } from '../../hooks/useEventTimeWindow';

const wrap = { margin: '12px 16px' };
const toggleStyle = { display: 'flex', alignItems: 'center', gap: 8, minHeight: 56, width: '100%', padding: '14px 16px', borderRadius: 10, border: '1px dashed var(--em-border-default)', backgroundColor: 'var(--em-bg-card-hover)', color: 'var(--em-text-secondary)', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' };
const labelStyle = { fontSize: 14, fontWeight: 600, color: 'var(--em-text-primary)' };
const subStyle = { fontSize: 12, color: 'var(--em-text-tertiary)', marginTop: 2 };

export default function GameDayMode({ event, isStaff, isGameType }) {
  const navigate = useNavigate();
  const { isGameDay, isPast } = useEventTimeWindow(event);
  const [forceOpen, setForceOpen] = useState(false);
  const expanded = isGameDay || forceOpen;
  const showLiveScore = isStaff && isGameType && !isPast && event.status !== 'cancelled' && event.team_id;

  if (!event?.team_id) return null;
  if (isPast && !forceOpen) return null;

  if (!expanded) {
    return (
      <div style={wrap}>
        <button type="button" className="sf-press" style={toggleStyle} onClick={() => setForceOpen(true)} aria-expanded={false}>
          <ChevronRight size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Show game-day tools</div>
            <div style={subStyle}>Active 4h before through 3h after start</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      {!isGameDay && (
        <button type="button" className="sf-press" style={{ ...toggleStyle, marginBottom: 8 }} onClick={() => setForceOpen(false)} aria-expanded>
          <ChevronDown size={16} strokeWidth={1.75} color="var(--em-text-tertiary)" />
          <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>Hide game-day tools</span>
        </button>
      )}
      <ArrivalBoard event={event} />
      {showLiveScore && (
        <Button onClick={() => navigate(`/events/${event.id}/live`)} style={{ width: '100%', marginTop: 12 }}>Live Score</Button>
      )}
    </div>
  );
}
