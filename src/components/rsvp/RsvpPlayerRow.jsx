import { useState } from 'react';
import { Check, X, HelpCircle } from 'lucide-react';

const BUTTONS = [
  { key: 'going', icon: Check, color: 'var(--sf-success)', bg: 'var(--sf-success-soft)', label: 'Going' },
  { key: 'maybe', icon: HelpCircle, color: 'var(--sf-warning)', bg: 'var(--sf-warning-soft)', label: 'Maybe' },
  { key: 'not_going', icon: X, color: 'var(--sf-danger)', bg: 'var(--sf-danger-soft)', label: 'Not going' },
];

export default function RsvpPlayerRow({ player, response, existingNote, teamColor, onSetRsvp, onSaveNote }) {
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(existingNote || '');

  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid var(--sf-border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Jersey circle */}
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: teamColor || 'var(--sf-bg-tertiary)',
          color: 'var(--sf-text-inverse)', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {player.jersey_number || '—'}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--sf-text-primary)' }}>
            {player.first_name} {player.last_name}
          </div>
          {player.member_type === 'futures_academy' && (
            <span style={{
              fontSize: 11, color: 'var(--sf-academy)', fontWeight: 500,
              backgroundColor: 'var(--sf-academy-soft)', padding: '1px 6px', borderRadius: 4,
            }}>Academy</span>
          )}
        </div>

        {/* RSVP buttons */}
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
                  width: 36, height: 36, borderRadius: 18,
                  border: active ? 'none' : '1px solid var(--sf-border-default)',
                  backgroundColor: active ? b.bg : 'transparent',
                  color: active ? b.color : 'var(--sf-text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        {!showNote && (
          <button type="button" onClick={() => setShowNote(true)}
            style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}>
            {existingNote ? 'Edit note' : 'Add note'}
          </button>
        )}
      </div>
      {showNote && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Out of town, back Thursday..."
            style={{
              flex: 1, fontSize: 13, padding: '6px 10px', borderRadius: 8,
              border: '1px solid var(--sf-border-default)', backgroundColor: 'var(--sf-bg-card)',
              color: 'var(--sf-text-primary)',
            }}
          />
          <button type="button" onClick={() => { onSaveNote?.(player.id, noteText); setShowNote(false); }}
            className="sf-press"
            style={{
              fontSize: 13, fontWeight: 500, color: 'var(--sf-accent)',
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid var(--sf-accent)', backgroundColor: 'transparent',
            }}>
            Save
          </button>
        </div>
      )}
      {existingNote && !showNote && (
        <div style={{ fontSize: 12, color: 'var(--sf-text-tertiary)', fontStyle: 'italic', marginTop: 2 }}>
          &ldquo;{existingNote}&rdquo;
        </div>
      )}
    </div>
  );
}
