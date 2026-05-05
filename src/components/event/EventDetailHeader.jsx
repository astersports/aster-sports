import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, UserCheck, Ban } from 'lucide-react';
import { TYPE_LABELS } from '../../lib/constants';

const iconBtn = { minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default function EventDetailHeader({ event, team, isStaff, onEdit, onDelete, onCheckin }) {
  const navigate = useNavigate();
  const teamColor = team?.team_color || 'var(--em-text-tertiary)';
  const typeLabel = TYPE_LABELS[event.event_type] || event.event_type;

  return (
    <>
      <div style={{ backgroundColor: teamColor, padding: '0 8px 16px 4px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => navigate(-1)} className="sf-press" aria-label="Go back" style={iconBtn}>
            <ArrowLeft size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {isStaff && (
              <button type="button" onClick={onCheckin} className="sf-press" aria-label="Take attendance" style={iconBtn}>
                <UserCheck size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
              </button>
            )}
            {isStaff && (
              <>
                <button type="button" onClick={onEdit} className="sf-press" aria-label="Edit event" style={iconBtn}>
                  <Pencil size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
                </button>
                <button type="button" onClick={onDelete} className="sf-press" aria-label="Delete event" style={iconBtn}>
                  <Trash2 size={20} strokeWidth={1.75} color="var(--em-text-inverse)" />
                </button>
              </>
            )}
          </div>
        </div>
        <div style={{ padding: '0 12px', marginTop: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', backgroundColor: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 6 }}>{typeLabel}</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--em-text-inverse)', margin: '12px 0 0 0' }}>
            {event.title || typeLabel}
          </h1>
          {team && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{team.name}</div>}
        </div>
      </div>
      {event.status === 'cancelled' && (
        <div style={{
          backgroundColor: 'var(--em-danger-soft)', padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 15, fontWeight: 500, color: 'var(--em-danger)',
        }}>
          <Ban size={16} strokeWidth={1.75} />
          This event has been cancelled
        </div>
      )}
    </>
  );
}
