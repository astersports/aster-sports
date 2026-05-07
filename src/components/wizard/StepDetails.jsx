import { useEffect, useState } from 'react';
import DutyEditor from './DutyEditor';
import { HOME_AWAY } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import Input from '../shared/Input';

export default function StepDetails({ eventType, data, onChange, orgId }) {
  const set = (key, val) => onChange({ ...data, [key]: val });
  const [tournaments, setTournaments] = useState([]);
  useEffect(() => {
    if (!orgId) return;
    supabase.from('tournaments').select('id, name').eq('org_id', orgId).in('status', ['planned', 'scheduled', 'in_progress']).order('start_date')
      .then(({ data: t }) => setTournaments(t || []));
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
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)' }}>Details</h2>

      <Input label="Title (optional)" type="text" value={data.title || ''} onChange={(e) => set('title', e.target.value)}
        placeholder={isGame ? 'vs. Storm AAU' : 'Practice'} />

      {isGame && (
        <Input label="Opponent" type="text" value={data.opponent || ''} onChange={(e) => set('opponent', e.target.value)}
          placeholder="Enter opponent name" />
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
          }} style={{ width: '100%', minHeight: 44, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, fontFamily: 'inherit' }}>
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
                className="sf-press" style={chipStyle(data.homeAway === v)}>
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
          style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, resize: 'vertical' }} />
      </label>

      <label style={fieldStyle}>
        <span style={labelStyle}>Coach notes</span>
        <span style={{ fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: -4 }}>Not visible to parents</span>
        <textarea value={data.coachNotes || ''} onChange={(e) => set('coachNotes', e.target.value)}
          placeholder="Internal notes" rows={2}
          style={{ width: '100%', minHeight: 60, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-tertiary)', color: 'var(--em-text-primary)', fontSize: 15, resize: 'vertical' }} />
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

function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label}
      onClick={() => onChange(!checked)} className="sf-press" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
      minHeight: 44, padding: '0 4px', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 15, color: 'var(--em-text-primary)' }}>{label}</span>
      <div style={{
        width: 48, height: 28, borderRadius: 14, padding: 2,
        backgroundColor: checked ? 'var(--em-accent)' : 'var(--em-bg-tertiary)',
        transition: 'background-color 0.2s', display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 9999, backgroundColor: 'var(--em-text-inverse)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s', boxShadow: 'var(--em-shadow-sm)',
        }} />
      </div>
    </button>
  );
}

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 6 };
const labelStyle = { fontSize: 13, fontWeight: 500, color: 'var(--em-text-secondary)' };
const chipStyle = (sel) => ({
  flex: 1, minHeight: 40, borderRadius: 10,
  border: sel ? '2px solid var(--em-accent)' : '1px solid var(--em-border-default)',
  backgroundColor: sel ? 'var(--em-accent)' : 'var(--em-bg-card)',
  color: sel ? 'var(--em-text-inverse)' : 'var(--em-text-primary)',
  fontSize: 13, fontWeight: 500,
});
