import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ban, MoreHorizontal, Pencil, Trash2, UserCheck } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';
import SendBriefingButton from '../briefings/SendBriefingButton';
import BottomSheet from '../shared/BottomSheet';

function eventBriefingKinds(event) {
  const kinds = ['schedule_change', 'announcement', 'custom_message'];
  const isPast = event?.start_at ? new Date(event.start_at) < new Date() : false;
  const isGame = event?.event_type === 'game' || event?.event_type === 'tournament';
  if (isPast && isGame) kinds.unshift('game_recap');
  if (!isPast) kinds.push('rsvp_nudge');
  return kinds;
}

const iconBtn = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };

const dateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York',
});

function buildSummary({ event, team, typeLabel }) {
  const parts = [];
  if (team?.name) parts.push(team.name);
  parts.push(typeLabel);
  if (event.start_at) parts.push(dateFmt.format(new Date(event.start_at)).replace(',', ''));
  if (event.home_away && event.home_away !== 'tbd') parts.push(event.home_away.toUpperCase());
  return parts.join(' · ');
}

const sheetItemBtn = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 56, padding: '0 16px', borderRadius: 10, border: 'none', backgroundColor: 'transparent', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' };

export default function EventDetailHeader({ event, team, isStaff, onEdit, onDelete, onCheckin, onCancel, onReinstate }) {
  const navigate = useNavigate();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const teamColor = team?.team_color || 'var(--as-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;
  const summary = buildSummary({ event, team, typeLabel });
  const briefingKinds = useMemo(() => eventBriefingKinds(event), [event]);
  const isCancelled = event.status === 'cancelled';

  // L99 PR C: Cancel/Reinstate + Delete moved into an overflow sheet.
  // Cancel button used to float at page bottom (orange, full-width);
  // delete used to sit as a standalone icon in the header row. Both
  // are rare-and-destructive — overflow is the right home for both.
  const handleOverflowItem = (fn) => () => { setOverflowOpen(false); fn?.(); };

  return (
    <div style={{ backgroundColor: teamColor, padding: '0 8px 16px 4px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => navigate(-1)} className="as-press" aria-label="Go back" style={iconBtn}>
          <ArrowLeft size={20} strokeWidth={1.75} color="var(--as-text-inverse)" />
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {isStaff && <button type="button" onClick={onCheckin} className="as-press" aria-label="Take attendance" style={iconBtn}><UserCheck size={20} strokeWidth={1.75} color="var(--as-text-inverse)" /></button>}
          {isStaff && <>
            <button type="button" onClick={onEdit} className="as-press" aria-label="Edit event" style={iconBtn}><Pencil size={20} strokeWidth={1.75} color="var(--as-text-inverse)" /></button>
            <SendBriefingButton anchorKind="event" anchorId={event.id} kindFilter={briefingKinds} variant="icon-only" iconColor="var(--as-text-inverse)" />
            <button type="button" onClick={() => setOverflowOpen(true)} className="as-press" aria-label="More actions" style={iconBtn}><MoreHorizontal size={20} strokeWidth={1.75} color="var(--as-text-inverse)" /></button>
          </>}
        </div>
      </div>
      <div style={{ padding: '0 12px', marginTop: 4 }}>
        <h1 style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-inverse)', margin: 0, lineHeight: 1.3 }}>{summary}</h1>
      </div>
      <BottomSheet open={overflowOpen} onClose={() => setOverflowOpen(false)} initialHeight="auto" expandedHeight="auto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0 16px' }}>
          {!isCancelled && onCancel && <button type="button" onClick={handleOverflowItem(onCancel)} className="as-press" style={{ ...sheetItemBtn, color: 'var(--as-warning)' }}><Ban size={18} strokeWidth={1.75} />Cancel event</button>}
          {isCancelled && onReinstate && <button type="button" onClick={handleOverflowItem(onReinstate)} className="as-press" style={{ ...sheetItemBtn, color: 'var(--as-text-primary)' }}><Ban size={18} strokeWidth={1.75} />Reinstate event</button>}
          {onDelete && <button type="button" onClick={handleOverflowItem(onDelete)} className="as-press" style={{ ...sheetItemBtn, color: 'var(--as-danger)' }}><Trash2 size={18} strokeWidth={1.75} />Delete event</button>}
        </div>
      </BottomSheet>
    </div>
  );
}
