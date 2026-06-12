import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Download, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/formatters';
import { formatEventTitleString } from '../lib/eventTitle';
import { downloadTeamIcs } from '../lib/icalHelpers';
import SubscribeSheet from '../components/shared/SubscribeSheet';
import ShareScheduleButton from '../components/shared/ShareScheduleButton';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'America/New_York',
  });
}

export default function PublicSchedulePage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);

  // RLS (anon): teams_select_public + events_select_public gate via the
  // SECURITY DEFINER org_is_public_listed() helper (P0 lane STEP 2,
  // 2026-06-12 — repairs the fail-closed gate shipped in 20260528140000,
  // which subqueried organizations that anon cannot read). The feed token +
  // org display name come from the gated get_public_subscribe_info() RPC;
  // anon bulk SELECT of teams.team_feed_token was revoked in STEP 1.
  useEffect(() => {
    (async () => {
      const [teamRes, eventsRes, infoRes] = await Promise.all([
        supabase.from('teams').select('id, name, team_color, org_id').eq('id', teamId).maybeSingle(),
        supabase.from('events').select('id, title, event_type, start_at, end_at, opponent, location_name:location, status')
          .eq('team_id', teamId).neq('status', 'cancelled')
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true }).limit(50),
        supabase.rpc('get_public_subscribe_info', { p_team_id: teamId }),
      ]);
      if (teamRes.error || eventsRes.error) {
        console.error('PublicSchedule load:', (teamRes.error || eventsRes.error).message);
        setLoadError(true);
        setLoading(false);
        return;
      }
      // RPC failure degrades to "subscribe unavailable", not a page error.
      const info = infoRes.data?.[0] || null;
      setTeam(teamRes.data
        ? { ...teamRes.data, team_feed_token: info?.feed_token ?? null, org_display_name: info?.org_display_name ?? '' }
        : null);
      setEvents(eventsRes.data || []);
      setLoading(false);
    })();
  }, [teamId]);

  useEffect(() => {
    if (team) document.title = `${team.name} Schedule`;
    return () => { document.title = 'Aster Sports'; };
  }, [team]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Loading schedule…</div>;
  if (loadError) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Couldn&rsquo;t load this schedule. Try again in a moment.</div>;
  if (!team) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Team not found.</div>;

  const orgName = team.org_display_name || '';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--as-bg-page)', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--as-text-tertiary)' }}>{orgName}</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--as-text-primary)', margin: '4px 0' }}>{team.name}</h1>
        <div style={{ width: 32, height: 3, backgroundColor: team.team_color || 'var(--as-accent)', borderRadius: 2, margin: '8px auto' }} />
        <div style={{ fontSize: 13, color: 'var(--as-text-tertiary)' }}>Upcoming schedule · {events.length} event{events.length !== 1 ? 's' : ''}</div>
      </div>

      {events.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)', fontSize: 15 }}>No upcoming events scheduled.</div>
      )}

      {events.map((e) => (
        <div key={e.id} style={{
          display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--as-bg-card)',
          borderRadius: 10, border: '1px solid var(--as-border-default)',
          boxShadow: 'var(--as-shadow-sm)', overflow: 'hidden', marginBottom: 8,
        }}>
          <div style={{ width: 4, flexShrink: 0, backgroundColor: team.team_color || 'var(--as-accent)' }} />
          <div style={{ flex: 1, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--as-text-primary)' }}>{formatDate(e.start_at)}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text-primary)', marginLeft: 4 }}>{formatTime(e.start_at)}</span>
            </div>
            <div style={{ fontSize: 15, color: 'var(--as-text-primary)', marginTop: 2 }}>
              {formatEventTitleString(e)}
            </div>
            {e.location_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--as-text-tertiary)', marginTop: 2 }}>
                <MapPin size={11} strokeWidth={1.75} />{e.location_name}
              </div>
            )}
          </div>
        </div>
      ))}

      {events.length > 0 && (
        <button type="button" onClick={() => downloadTeamIcs(team.name, events)} className="as-press" style={ctaBtnStyle}>
          <Download size={16} strokeWidth={1.75} />
          Download Schedule (.ics)
        </button>
      )}

      {events.length > 0 && (
        <button type="button" onClick={() => setShowSubscribe(true)} className="as-press" style={{ ...ctaBtnStyle, marginTop: 8 }}>
          <Calendar size={16} strokeWidth={1.75} />
          Subscribe to Calendar
        </button>
      )}

      <ShareScheduleButton teamId={teamId} label="Share / QR" style={{ ...ctaBtnStyle, marginTop: 8 }} />

      <SubscribeSheet open={showSubscribe} onClose={() => setShowSubscribe(false)} team={team} />

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--as-text-tertiary)' }}>
        Powered by Aster Sports · <a href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy</a> · <a href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms</a>
      </div>
    </div>
  );
}

const ctaBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  width: '100%', minHeight: 44, marginTop: 16, borderRadius: 10,
  border: '1px solid var(--as-border-default)', backgroundColor: 'var(--as-bg-card)',
  color: 'var(--as-accent)', fontSize: 15, fontWeight: 500,
};
