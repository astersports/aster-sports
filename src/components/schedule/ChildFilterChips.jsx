import { memo } from 'react';
import FilterSelect from '../shared/FilterSelect';

function ChildFilterChips({ kids, activeFilter, onChange }) {
  if (!kids || kids.length < 2) return null;

  return (
    <div style={{ paddingBottom: 6 }}>
      <FilterSelect
        value={activeFilter}
        onChange={onChange}
        options={[{ value: null, label: 'All Children' }, ...kids.map(k => ({ value: k.playerId, label: k.firstName }))]}
        ariaLabel="Filter by child"
      />
    </div>
  );
}

export default memo(ChildFilterChips);
