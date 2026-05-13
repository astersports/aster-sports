import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const TYPEAHEAD_THRESHOLD = 15;

export default function TeamMultiSelect({ selectedIds = [], onChange }) {
  const { orgId } = useAuth();
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!orgId) return;
    supabase.from('teams')
      .select('id, name, sort_order, team_color')
      .eq('org_id', orgId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => setTeams(data || []));
  }, [orgId]);

  const useTypeahead = teams.length > TYPEAHEAD_THRESHOLD;
  const filtered = useMemo(() => {
    if (!useTypeahead || !search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, search, useTypeahead]);

  const toggle = (teamId) => {
    const next = selectedIds.includes(teamId)
      ? selectedIds.filter((id) => id !== teamId)
      : [...selectedIds, teamId];
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {useTypeahead && (
        <div style={{ position: 'relative' }}>
          <Search size={16} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--em-text-tertiary)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${teams.length} teams`}
            aria-label="Search teams"
            style={{
              width: '100%', minHeight: 44, padding: '10px 12px 10px 36px', borderRadius: 10,
              border: '1.5px solid var(--em-border-default)',
              backgroundColor: 'var(--em-bg-tertiary)',
              color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: useTypeahead ? 320 : 'none', overflowY: useTypeahead ? 'auto' : 'visible' }}>
        {filtered.map((t) => {
          const selected = selectedIds.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className="sf-press"
              aria-pressed={selected}
              aria-label={`${selected ? 'Deselect' : 'Select'} ${t.name}`}
              style={{
                minHeight: 44, padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${selected ? 'var(--em-accent)' : 'var(--em-border-default)'}`,
                backgroundColor: selected ? 'var(--em-accent-soft)' : 'var(--em-bg-card)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)',
                cursor: 'pointer', width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: t.team_color || 'var(--em-text-tertiary)', flexShrink: 0 }} />
                <span>{t.name}</span>
              </div>
              {selected && <Check size={18} strokeWidth={2} color="var(--em-accent)" />}
            </button>
          );
        })}
        {useTypeahead && filtered.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--em-text-tertiary)' }}>
            No teams match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
