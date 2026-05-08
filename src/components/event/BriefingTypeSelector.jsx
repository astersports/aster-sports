import { Pencil } from 'lucide-react';
import { messageTypeLabel, whyLabel } from '../../lib/inferMessageType';

const ghostBtn = {
  minHeight: 32, padding: '0 10px', borderRadius: 8,
  backgroundColor: 'transparent', color: 'var(--em-text-secondary)',
  fontSize: 12, fontWeight: 500,
  border: '1px solid var(--em-border-default)',
  display: 'inline-flex', alignItems: 'center', gap: 4,
  cursor: 'pointer', fontFamily: 'inherit',
};
const dropdownStyle = {
  width: '100%', minHeight: 44, padding: '0 12px',
  borderRadius: 10, border: '1.5px solid var(--em-border-default)',
  backgroundColor: 'var(--em-bg-card)', color: 'var(--em-text-primary)',
  fontSize: 15, fontWeight: 500, fontFamily: 'inherit', appearance: 'none',
};

// Inline "Sending as: {label} ({why}) [edit]" with a hidden dropdown that
// reveals on tap. Operator override of the auto-inferred type. Excluded
// from TournamentBriefing.jsx to keep that file under 150 lines.
export default function BriefingTypeSelector({ value, onChange, options, editing, onToggleEditing }) {
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--em-text-secondary)' }}>
          Sending as: <strong style={{ color: 'var(--em-text-primary)' }}>{messageTypeLabel(value)}</strong>{' '}
          <span style={{ color: 'var(--em-text-tertiary)' }}>({whyLabel(value)})</span>
        </div>
        <button type="button" onClick={onToggleEditing} className="sf-press" style={ghostBtn} aria-label="Edit message type">
          <Pencil size={12} strokeWidth={1.75} /> {editing ? 'Done' : 'edit'}
        </button>
      </div>
      {editing && (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...dropdownStyle, marginTop: 8 }} aria-label="Message type">
          {options.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      )}
    </div>
  );
}
