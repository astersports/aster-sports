// Wave 3.12 — three filter dropdowns: Kind / Team / Date.
// Active chips render below with ✕ removal. Filter state persisted
// per-admin via useBriefingFilters → briefing_inbox_preferences.

import { ChevronDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { KIND_METADATA, KIND_ORDER } from '../../../lib/briefings/kindMetadata';

const dropdownWrap = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const dropdownBtn = (active) => ({ minHeight: 36, padding: '0 12px', borderRadius: 9999, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--em-border-default)', backgroundColor: active ? 'var(--em-accent-soft)' : 'var(--em-bg-card)', color: 'var(--em-text-primary)' });
const menuStyle = { position: 'absolute', top: '100%', left: 0, marginTop: 4, backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10, padding: 6, minWidth: 180, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
const menuItem = (active) => ({ width: '100%', minHeight: 36, padding: '0 10px', borderRadius: 6, fontSize: 13, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', border: 'none', backgroundColor: active ? 'var(--em-accent-soft)' : 'transparent', color: 'var(--em-text-primary)', display: 'flex', alignItems: 'center', gap: 6 });
const chipStyle = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 9999, fontSize: 12, backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)' };
const chipX = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', color: 'var(--em-text-tertiary)' };

const DATE_OPTIONS = [
  { v: 'all', l: 'All time' }, { v: 'today', l: 'Today' },
  { v: 'this_week', l: 'This week' }, { v: 'next_7_days', l: 'Last/Next 7 days' },
];

export default function InboxFilters({ filters, onChange, onClear }) {
  const { orgId } = useAuth();
  const [openMenu, setOpenMenu] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!orgId) return undefined;
    Promise.resolve().then(async () => {
      const { data } = await supabase.from('teams').select('id,name').eq('org_id', orgId).order('sort_order');
      setTeams(data || []);
    });
    return undefined;
  }, [orgId]);

  const kindLabel = filters.kind ? (KIND_METADATA[filters.kind]?.label || filters.kind) : 'All kinds';
  const teamLabel = filters.teams?.length ? `${filters.teams.length} team${filters.teams.length === 1 ? '' : 's'}` : 'All teams';
  const dateLabel = DATE_OPTIONS.find((d) => d.v === filters.dateRange)?.l || 'All time';

  const toggleTeam = (id) => {
    const has = (filters.teams || []).includes(id);
    onChange({ teams: has ? filters.teams.filter((t) => t !== id) : [...(filters.teams || []), id] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={dropdownWrap}>
        <div style={{ position: 'relative' }}>
          <button type="button" style={dropdownBtn(!!filters.kind)} onClick={() => setOpenMenu(openMenu === 'kind' ? null : 'kind')}>{kindLabel} <ChevronDown size={12} /></button>
          {openMenu === 'kind' && (
            <div style={menuStyle}>
              <button type="button" style={menuItem(!filters.kind)} onClick={() => { onChange({ kind: null }); setOpenMenu(null); }}>All kinds</button>
              {KIND_ORDER.filter((k) => !KIND_METADATA[k]?.disabled).map((k) => { const m = KIND_METADATA[k]; return (
                <button key={k} type="button" style={menuItem(filters.kind === k)} onClick={() => { onChange({ kind: k }); setOpenMenu(null); }}>{m.label}</button>
              ); })}
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button type="button" style={dropdownBtn(!!filters.teams?.length)} onClick={() => setOpenMenu(openMenu === 'team' ? null : 'team')}>{teamLabel} <ChevronDown size={12} /></button>
          {openMenu === 'team' && (
            <div style={menuStyle}>
              {teams.map((t) => (
                <button key={t.id} type="button" style={menuItem(filters.teams?.includes(t.id))} onClick={() => toggleTeam(t.id)}>{t.name}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button type="button" style={dropdownBtn(filters.dateRange !== 'all')} onClick={() => setOpenMenu(openMenu === 'date' ? null : 'date')}>{dateLabel} <ChevronDown size={12} /></button>
          {openMenu === 'date' && (
            <div style={menuStyle}>
              {DATE_OPTIONS.map((d) => (
                <button key={d.v} type="button" style={menuItem(filters.dateRange === d.v)} onClick={() => { onChange({ dateRange: d.v }); setOpenMenu(null); }}>{d.l}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      {(filters.kind || filters.teams?.length || filters.dateRange !== 'all') && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {filters.kind && <span style={chipStyle}>Kind: {kindLabel} <button type="button" style={chipX} onClick={() => onChange({ kind: null })}><X size={12} /></button></span>}
          {filters.teams?.map((id) => { const t = teams.find((x) => x.id === id); return t && <span key={id} style={chipStyle}>{t.name} <button type="button" style={chipX} onClick={() => toggleTeam(id)}><X size={12} /></button></span>; })}
          {filters.dateRange !== 'all' && <span style={chipStyle}>{dateLabel} <button type="button" style={chipX} onClick={() => onChange({ dateRange: 'all' })}><X size={12} /></button></span>}
          <button type="button" onClick={onClear} style={{ ...chipStyle, backgroundColor: 'transparent', border: '1px dashed var(--em-border-default)', cursor: 'pointer' }}>Clear all</button>
        </div>
      )}
    </div>
  );
}
