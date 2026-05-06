import { memo } from 'react';
import Chip from '../shared/Chip';

function ChildFilterChips({ kids, activeFilter, onChange }) {
  if (!kids || kids.length < 2) return null;

  return (
    <div className="flex gap-2 flex-wrap" style={{ paddingBottom: 6 }}>
      <Chip label="All" active={activeFilter === null} onClick={() => onChange(null)} />
      {kids.map((kid) => (
        <Chip
          key={kid.playerId}
          label={kid.firstName}
          active={activeFilter === kid.playerId}
          onClick={() => onChange(kid.playerId)}
        />
      ))}
    </div>
  );
}

export default memo(ChildFilterChips);
