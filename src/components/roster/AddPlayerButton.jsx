import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import AddPlayerSheet from './AddPlayerSheet';

// Teams PR-2 Part A — staff-only "Add player" entry point above the roster.
// Owns the picker sheet open state; the add fires through the PR-0
// add_roster_member RPC (passed in as addPlayer from useRosterActions).
export default function AddPlayerButton({ teamId, orgId, teamColor, addPlayer }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button" aria-label="Add player to roster"
        onClick={() => { navigator.vibrate?.(10); setOpen(true); }}
        className="as-press flex items-center"
        style={{ minHeight: 36, padding: '0 12px', gap: 6, borderRadius: 8, border: '1px solid var(--as-accent)', backgroundColor: 'var(--as-accent-soft)', color: 'var(--as-accent)', fontSize: 13, fontWeight: 600 }}
      >
        <UserPlus size={16} strokeWidth={1.75} aria-hidden="true" /> Add player
      </button>
      <AddPlayerSheet open={open} onClose={() => setOpen(false)} teamId={teamId} orgId={orgId} teamColor={teamColor} addPlayer={addPlayer} />
    </>
  );
}
