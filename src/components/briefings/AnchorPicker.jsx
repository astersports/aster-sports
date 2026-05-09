// Wave 3.11 follow-up — anchor picker. Search-as-you-type for
// events / tournaments / teams / org. Filter set determined by
// the selected kind via kindMetadata.

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { KIND_METADATA } from '../../lib/briefings/kindMetadata';

const inputStyle = { width: '100%', minHeight: 44, padding: '0 12px', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', backgroundColor: 'var(--em-bg-tertiary)', border: '1.5px solid var(--em-border-default)', color: 'var(--em-text-primary)' };
const resultRow = { padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14, color: 'var(--em-text-primary)', backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-subtle)', display: 'flex', flexDirection: 'column', gap: 2 };

async function search(orgId, kind, query) {
  const meta = KIND_METADATA[kind] || {};
  const q = (query || '').trim().toLowerCase();
  if (meta.defaultAnchorKind === 'org') return [{ id: orgId, label: 'All program', type: 'org' }];
  if (meta.anchorKinds?.includes('tournament')) {
    const r = await supabase.from('tournaments').select('id,name,start_date,end_date').ilike('name', `%${q}%`).limit(8);
    return (r.data || []).map((t) => ({ id: t.id, label: t.name, secondary: `${t.start_date} – ${t.end_date}`, type: 'tournament' }));
  }
  if (meta.anchorKinds?.includes('event')) {
    const r = await supabase.from('events').select('id,title,start_at,team_id,teams(name)').ilike('title', `%${q}%`).limit(8).order('start_at', { ascending: false });
    return (r.data || []).map((e) => ({ id: e.id, label: e.title, secondary: `${new Date(e.start_at).toLocaleDateString()} · ${e.teams?.name || ''}`, type: 'event' }));
  }
  if (meta.anchorKinds?.includes('team')) {
    const r = await supabase.from('teams').select('id,name').ilike('name', `%${q}%`).order('sort_order').limit(8);
    return (r.data || []).map((t) => ({ id: t.id, label: t.name, type: 'team' }));
  }
  return [];
}

export default function AnchorPicker({ kind, anchorId, onPick }) {
  const { orgId } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const meta = KIND_METADATA[kind] || {};
  const locked = meta.anchorLocked;
  const orgOnly = meta.defaultAnchorKind === 'org' && meta.anchorKinds?.length === 1;

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      const r = await search(orgId, kind, query);
      if (!cancelled) setResults(r);
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [orgId, kind, query]);

  const selectedLabel = useMemo(() => results.find((r) => r.id === anchorId)?.label || '', [results, anchorId]);

  if (orgOnly) return null; // hidden picker — caller already set anchor on kind select

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="text" disabled={locked} value={locked ? selectedLabel : query} onChange={(e) => setQuery(e.target.value)} placeholder={locked ? '' : 'Search by name…'} style={{ ...inputStyle, opacity: locked ? 0.7 : 1 }} />
      {!locked && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
          {results.map((r) => (
            <button key={`${r.type}-${r.id}`} type="button" className="sf-press" onClick={() => onPick(r.type, r.id)}
              style={{ ...resultRow, border: r.id === anchorId ? '1.5px solid var(--em-accent)' : resultRow.border, textAlign: 'left' }}>
              <span style={{ fontWeight: 600 }}>{r.label}</span>
              {r.secondary && <span style={{ fontSize: 12, color: 'var(--em-text-tertiary)' }}>{r.secondary}</span>}
            </button>
          ))}
          {!results.length && query && <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>No matches.</span>}
        </div>
      )}
    </div>
  );
}
