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
  const [showSubscribe, setShowSubscribe] = useState(false);

  // RLS (anon): teams_select_public + events_select_public gate by
  // organizations.public_listing_enabled (Wave 1 P0 #4 closure, mig
  // 20260528140000_wave_1_public_listing_gating — replaced the prior
  // hardcoded LH org_id with a per-org flag). Default for new tenants
  // flipped to false by mig 20260602154853 (Wave 3.B #28 P0-4) so a
  // pilot org opts INTO public listing after content review.
  useEffect(() => {
    (async () => {
      const [teamRes, eventsRes] = await Promise.all([
        supabase.from('teams').select('id, name, team_color, org_id, team_feed_token, organizations(name, display_name)').eq('id', teamId).maybeSingle(),
        supabase.from('events').select('id, title, event_type, start_at, end_at, opponent, location_name, status')
          .eq('team_id', teamId).neq('status', 'cancelled')
          .gte('start_at', new Date().toISOString())
          .order('start_at', { ascending: true }).limit(50),
      ]);
      setTeam(teamRes.data);
      setEvents(eventsRes.data || []);
      setLoading(false);
    })();
  }, [teamId]);

  useEffect(() => {
    if (team) document.title = `${team.name} Schedule`;
    return () => { document.title = 'Aster Sports'; };
  }, [team]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Loading schedule…</div>;
  if (!team) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-text-tertiary)' }}>Team not found.</div>;

  const orgName = team.organizations?.display_name || team.organizations?.name || '';

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
