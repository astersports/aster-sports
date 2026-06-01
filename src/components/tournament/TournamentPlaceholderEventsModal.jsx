import { useEffect, useMemo, useState } from 'react';
import FullScreenForm from '../shared/FullScreenForm';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/useToast';
import { weekendDaysInRange } from '../../lib/tournamentWeekend';

// Wave 3.5 §C3: after a multi-day tournament create that spans a
// weekend, prompt admin to bulk-INSERT 8am-8pm placeholder events for
// each (team × weekend day) cell. Location dropdown fetches existing
// locations; placeholder venues (name LIKE 'Tournament -%') float to
// the top. Default: every checkbox checked. Operator can uncheck cells
// or skip entirely.

const labelStyle = { fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--as-text-secondary)', marginBottom: 6, display: 'block' };
const selectStyle = { width: '100%', minHeight: 44, padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-tertiary)', color: 'var(--as-text-primary)', fontSize: 15, fontFamily: 'inherit' };
const cellStyle = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 14, color: 'var(--as-text-primary)' };

function isoDateTimeUtc(dateStr, hhmm) {
  // Interpret as NY-tz local time → ISO. The wizard already encodes
  // local-time the same way; staying consistent so day-grouping in the
  // digest schedule renderer puts these on the right NY-local day.
  return new Date(`${dateStr}T${hhmm}:00`).toISOString();
}

export default function TournamentPlaceholderEventsModal({ tournament, teamIds, onClose }) {
  const { showToast } = useToast();
  const days = useMemo(() => weekendDaysInRange(tournament?.start_date, tournament?.end_date), [tournament]);
  const [teams, setTeams] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [cells, setCells] = useState({}); // key: `${teamId}:${dayIso}` → boolean
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled || !teamIds?.length) return;
      // Beta B1 audit defense-in-depth — anti-pattern #37.
      // teamIds came from tournament.tournament_teams (org-scoped) so this
      // is implicit-scoped, but explicit filter matches the canonical pattern.
      const [{ data: tRows }, { data: lRows }] = await Promise.all([
        supabase.from('teams').select('id, name, sort_order').eq('org_id', tournament.org_id).in('id', teamIds),
        supabase.from('locations').select('id, name, address').eq('org_id', tournament.org_id).is('archived_at', null).order('name'),
      ]);
      if (cancelled) return;
      const sortedTeams = [...(tRows || [])].sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
      setTeams(sortedTeams);
      const placeholderFirst = [...(lRows || [])].sort((a, b) => {
        const aPlace = a.name?.startsWith('Tournament -') ? 0 : 1;
        const bPlace = b.name?.startsWith('Tournament -') ? 0 : 1;
        return aPlace - bPlace || (a.name || '').localeCompare(b.name || '');
      });
      setLocations(placeholderFirst);
      const firstPlaceholder = placeholderFirst.find((l) => l.name?.startsWith('Tournament -'));
      setLocationId(firstPlaceholder?.id || '');
      const initial = {};
      sortedTeams.forEach((t) => days.forEach((d) => { initial[`${t.id}:${d.iso}`] = true; }));
      setCells(initial);
    });
    return () => { cancelled = true; };
  }, [teamIds, tournament?.org_id, days]);

  const toggle = (teamId, dayIso) => setCells((c) => ({ ...c, [`${teamId}:${dayIso}`]: !c[`${teamId}:${dayIso}`] }));
  const checkedCount = useMemo(() => Object.values(cells).filter(Boolean).length, [cells]);
  const canSave = !saving && checkedCount > 0 && !!locationId;

  const onConfirm = async () => {
    if (!canSave) return;
    setSaving(true);
    const rows = [];
    for (const team of teams) {
      for (const day of days) {
        if (!cells[`${team.id}:${day.iso}`]) continue;
        rows.push({
          team_id: team.id,
          event_type: 'tournament',
          title: tournament.name,
          start_at: isoDateTimeUtc(day.iso, '08:00'),
          end_at: isoDateTimeUtc(day.iso, '20:00'),
          tournament_id: tournament.id,
          tournament_name: tournament.name,
          location_id: locationId,
          status: 'scheduled',
          publish_status: 'published',
          home_away: 'neutral',
        });
      }
    }
    if (!rows.length) { setSaving(false); return; }
    const { error } = await supabase.from('events').insert(rows);
    setSaving(false);
    if (error) { showToast(`Couldn't create placeholders: ${error.message}`, 'error'); return; }
    showToast(`Created ${rows.length} placeholder ${rows.length === 1 ? 'event' : 'events'}.`, 'success');
    onClose?.();
  };

  if (!days.length) { onClose?.(); return null; }

  return (
    <FullScreenForm open onClose={onClose} title="Tournament placeholder events">
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--as-text-primary)', lineHeight: 1.5 }}>
          <strong>{tournament?.name}</strong> spans a weekend. Create 8am–8pm placeholder events
          for each team and day? Detail can be filled in later as the schedule firms up.
        </div>

        <div>
          <label htmlFor="ph-loc" style={labelStyle}>Placeholder venue</label>
          <select id="ph-loc" value={locationId} onChange={(e) => setLocationId(e.target.value)} style={selectStyle}>
            <option value="">Select a venue…</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {!locationId && <div style={{ fontSize: 12, color: 'var(--as-warning)', marginTop: 6 }}>Pick a venue to enable placeholder creation.</div>}
        </div>

        <div>
          <span style={labelStyle}>Cells to create ({checkedCount})</span>
          {teams.map((team) => (
            <div key={team.id} style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)', marginBottom: 4 }}>{team.name}</div>
              {days.map((d) => (
                <label key={d.iso} style={cellStyle}>
                  <input type="checkbox" checked={!!cells[`${team.id}:${d.iso}`]} onChange={() => toggle(team.id, d.iso)} style={{ width: 16, height: 16 }} />
                  {d.label} · 8:00 AM – 8:00 PM
                </label>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <button type="button" onClick={onClose} className="as-press"
            style={{ flex: 1, minHeight: 44, borderRadius: 10, border: '1.5px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)', color: 'var(--as-text-primary)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Skip
          </button>
          <button type="button" onClick={onConfirm} disabled={!canSave} className="as-press"
            style={{ flex: 1, minHeight: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--as-accent)', color: 'var(--as-text-inverse)', fontSize: 15, fontWeight: 600, opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Creating…' : `Create ${checkedCount}`}
          </button>
        </div>
      </div>
    </FullScreenForm>
  );
}
