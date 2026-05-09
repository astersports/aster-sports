// Wave 3.12 — sticky search bar. Active tab searches anchor names;
// History tab searches subject + body_plain. The hook upstream applies
// the right scope.

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

const wrap = { position: 'sticky', top: 0, zIndex: 5, backgroundColor: 'var(--em-bg-page)', padding: '8px 0' };
const inputWrap = { position: 'relative' };
const iconStyle = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--em-text-tertiary)' };
const inputStyle = { width: '100%', minHeight: 40, padding: '0 12px 0 38px', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', color: 'var(--em-text-primary)' };

export default function InboxSearch({ value, onChange, placeholder }) {
  const [local, setLocal] = useState(value || '');
  useEffect(() => {
    Promise.resolve().then(() => setLocal(value || ''));
  }, [value]);
  useEffect(() => {
    const t = setTimeout(() => { if (local !== value) onChange(local); }, 250);
    return () => clearTimeout(t);
  }, [local, value, onChange]);
  return (
    <div style={wrap}>
      <div style={inputWrap}>
        <Search size={16} strokeWidth={1.75} style={iconStyle} />
        <input type="search" value={local} onChange={(e) => setLocal(e.target.value)} placeholder={placeholder || 'Search briefings…'} style={inputStyle} />
      </div>
    </div>
  );
}
