import { useEffect, useState } from 'react';
import DutyEditor from './DutyEditor';
import { HOME_AWAY } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import Input from '../shared/Input';
import Toggle from '../shared/Toggle';

export default function StepDetails({ eventType, data, onChange, orgId }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const [tournaments, setTournaments] = useState([]);
  const [opponents, setOpponents] = useState([]);
  useEffect(() => {
    if (!orgId) return;
    // Phase 1 audit P1-7 — archived_at filter (tournaments archived rows
    // should not surface in the Create/Edit wizard tournament picker).
    supabase.from('tournaments').select('id, name').eq('org_id', orgId).is('archived_at', null).in('status', ['planned', 'scheduled', 'in_progress']).order('start_date')
      .then(({ data: t }) => setTournaments(t || []));
    supabase.from('opponents').select('id, name').eq('org_id', orgId).order('name')
      .then(({ data: o }) => setOpponents(o || []));
  }, [orgId]);
  const setHomeAway = (val) => {
    onChange({
      ...data,
      homeAway: val,
      jersey: val === 'home' ? 'Black' : val === 'away' ? 'White' : data.jersey,
    });
  };
  const isGame = eventType === 'game' || eventType === 'tournament';

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--as-text-primary)' }}>Details</h2>

      <Input label="Title (optional)" type="text" value={data.title || ''} onChange={(e) => set('title', e.target.value)}
        placeholder={isGame ? 'vs. Storm AAU' : 'Practice'} />

      {isGame && (
        <div>
          <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>
            Opponent <span style={{ color: 'var(--as-danger)' }} aria-hidden="true">*</span>
          </span>
          <input list="opponent-list" value={data.opponent || ''} onChange={(e) => set('opponent', e.target.value)}
            placeholder="Search or type opponent name" aria-label="Opponent" aria-required="true" required
            style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit' }} />
          <datalist id="opponent-list">
            {opponents.map((o) => <option key={o.id} value={o.name} />)}
          </datalist>
          {!(data.opponent || '').trim() && (
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--as-text-tertiary)' }}>
              Required — pick a saved opponent or type a new one.
            </div>
          )}
        </div>
      )}

      {isGame && tournaments.length > 0 && (
        <div>
          <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>Tournament</span>
          <select value={data.tournamentId || ''} onChange={(e) => {
            const tid = e.target.value || null;
            const t = tournaments.find((x) => x.id === tid);
            set('tournamentId', tid);
            if (t) onChange({ ...data, tournamentId: tid, tournamentName: t.name, eventType: 'tournament' });
            else onChange({ ...data, tournamentId: null, tournamentName: '', eventType: 'game' });
          }} style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit' }}>
            <option value="">No tournament</option>
            {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      )}

      {isGame && (
        <div>
          <span style={{ ...labelStyle, marginBottom: 6, display: 'block' }}>Home / Away</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {HOME_AWAY.map((v) => (
              <button key={v} type="button" onClick={() => setHomeAway(v)}
                className="as-press" style={chipStyle(data.homeAway === v)}>
                {v === 'tbd' ? 'TBD' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {isGame && (
        <Input label="Jersey color" type="text" value={data.jersey || ''} onChange={(e) => set('jersey', e.target.value)}
          placeholder="e.g. White home, Black away" />
      )}

      <label style={fieldStyle}>
        <span style={labelStyle}>Parent instructions</span>
        <textarea value={data.notes || ''} onChange={(e) => set('notes', e.target.value)}
          placeholder="Visible to parents" rows={3}
          style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, resize: 'vertical' }} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Coach notes</span>
        <span style={{ fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: -4 }}>Not visible to parents</span>
        <textarea value={data.coachNotes || ''} onChange={(e) => set('coachNotes', e.target.value)}
          placeholder="Internal notes" rows={2}
          style={{ width: '100%', minHeight: 60, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, resize: 'vertical' }} />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Toggle label="Indoor" checked={data.indoor ?? true} onChange={(v) => set('indoor', v)} />
        <Toggle label="Enable rides" checked={data.enableRides || false} onChange={(v) => set('enableRides', v)} />
        {isGame && <Toggle label="Scrimmage" checked={data.isScrimmage || false} onChange={(v) => set('isScrimmage', v)} />}
        {isGame && data.tournamentId && <Toggle label="Playoff / bracket game" checked={data.isBracketGame || false} onChange={(v) => set('isBracketGame', v)} />}
        {isGame && data.tournamentId && <Toggle label="Championship final" checked={data.isChampionshipFinal || false} onChange={(v) => set('isChampionshipFinal', v)} />}
        {isGame && data.tournamentId && <Toggle label="Bonus game (doesn't affect seeding)" checked={data.isBonusGame || false} onChange={(v) => set('isBonusGame', v)} />}
      </div>

      <DutyEditor value={data.duties} onChange={(duties) => set('duties', duties)} />
    </div>
  );
}

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--as-text-secondary)' };
const chipStyle = (sel) => ({
  flex: 1, minHeight: 40, borderRadius: 10,
  border: sel ? '2px solid var(--as-accent)' : '1px solid var(--as-border-default)',
  backgroundColor: sel ? 'var(--as-accent)' : 'var(--as-bg-card)',
  color: sel ? 'var(--as-text-inverse)' : 'var(--as-text-primary)',
  fontSize: 13, fontWeight: 500,
});
