import { useEffect, useState } from 'react';
import { Check, HelpCircle, X } from 'lucide-react';
import Input from '../shared/Input';
import { useAuth } from '../../context/AuthContext';

const BUTTONS = [
  { key: 'going', icon: Check, color: 'var(--em-success)', bg: 'var(--em-success-soft)', label: 'Going' },
  { key: 'maybe', icon: HelpCircle, color: 'var(--em-warning)', bg: 'var(--em-warning-soft)', label: 'Maybe' },
  { key: 'not_going', icon: X, color: 'var(--em-danger)', bg: 'var(--em-danger-soft)', label: 'Not going' },
];

const STATUS_LABELS = {
  going:     { label: 'Going',     color: 'var(--em-success)' },
  maybe:     { label: 'Maybe',     color: 'var(--em-warning)' },
  not_going: { label: 'Not Going', color: 'var(--em-danger)' },
};

export default function RsvpPlayerRow({ player, response, existingNote, teamColor, onSetRsvp, onSaveNote, forceReadOnly = false }) {
  const { role, myChildren } = useAuth();
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(existingNote || '');
  useEffect(() => { Promise.resolve().then(() => setNoteText(existingNote || '')); }, [existingNote]);
  const isMyChild = (myChildren || []).some((c) => c.playerId === player.id);
  // forceReadOnly comes from EventRsvpTab when the event is past — admins
  // and coaches still see the rows, just can't toggle status on history.
  const readOnly = forceReadOnly || (role === 'parent' && !isMyChild);

  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid var(--em-border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Jersey circle */}
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: teamColor || 'var(--em-bg-tertiary)',
          color: 'var(--em-text-inverse)', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {player.jersey_number || '—'}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
            {player.first_name} {player.last_name}
          </div>
          {player.member_type === 'futures_academy' && (
            <span style={{
              fontSize: 11, color: 'var(--em-academy)', fontWeight: 500,
              backgroundColor: 'var(--em-academy-soft)', padding: '1px 6px', borderRadius: 4,
            }}>Academy</span>
          )}
        </div>

        {/* RSVP buttons or read-only status */}
        {readOnly ? (
          <div style={{ fontSize: 13, fontWeight: 500, color: STATUS_LABELS[response]?.color || 'var(--em-text-tertiary)' }}>
            {STATUS_LABELS[response]?.label || 'No response'}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            {BUTTONS.map((b) => {
              const Icon = b.icon;
              const active = response === b.key;
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => onSetRsvp(player.id, b.key)}
                  className="sf-press"
                  aria-label={b.label}
                  style={{
                    width: 44, height: 44, borderRadius: 22,
                    border: active ? 'none' : '1px solid var(--em-border-default)',
                    backgroundColor: active ? b.bg : 'transparent',
                    color: active ? b.color : 'var(--em-text-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
                </button>
              );
            })}
          </div>
        )}
      </div>
      {!readOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
          {!showNote && (
            <button type="button" onClick={() => setShowNote(true)}
              style={{ fontSize: 13, color: 'var(--em-text-tertiary)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}>
              {existingNote ? 'Edit note' : 'Add note'}
            </button>
          )}
        </div>
      )}
      {!readOnly && showNote && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Out of town, back Thursday..."
              style={{ fontSize: 13, padding: '6px 10px', minHeight: 36 }}
            />
          </div>
          <button type="button" onClick={() => { onSaveNote?.(player.id, noteText); setShowNote(false); }}
            className="sf-press"
            style={{
              fontSize: 13, fontWeight: 500, color: 'var(--em-accent)',
              padding: '6px 12px', borderRadius: 10,
              border: '1px solid var(--em-accent)', backgroundColor: 'transparent',
              minHeight: 36,
            }}>
            Save
          </button>
        </div>
      )}
      {existingNote && !showNote && (
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)', fontStyle: 'italic', marginTop: 2 }}>
          &ldquo;{existingNote}&rdquo;
        </div>
      )}
    </div>
  );
}
