import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Download, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/formatters';
import { TYPE_LABELS } from '../lib/constants';
import { downloadTeamIcs } from '../lib/icalHelpers';
import BottomSheet from '../components/shared/BottomSheet';

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

  useEffect(() => {
    (async () => {
      const [teamRes, eventsRes] = await Promise.all([
        supabase.from('teams').select('id, name, team_color, org_id, organizations(name, display_name)').eq('id', teamId).maybeSingle(),
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
    return () => { document.title = 'Ember'; };
  }, [team]);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Loading schedule…</div>;
  if (!team) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)' }}>Team not found.</div>;

  const orgName = team.organizations?.display_name || team.organizations?.name || '';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px', backgroundColor: 'var(--em-bg-page)', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--em-text-tertiary)' }}>{orgName}</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--em-text-primary)', margin: '4px 0' }}>{team.name}</h1>
        <div style={{ width: 32, height: 3, backgroundColor: team.team_color || 'var(--em-accent)', borderRadius: 2, margin: '8px auto' }} />
        <div style={{ fontSize: 13, color: 'var(--em-text-tertiary)' }}>Upcoming schedule · {events.length} event{events.length !== 1 ? 's' : ''}</div>
      </div>

      {events.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--em-text-tertiary)', fontSize: 15 }}>No upcoming events scheduled.</div>
      )}

      {events.map((e) => (
        <div key={e.id} style={{
          display: 'flex', alignItems: 'stretch', backgroundColor: 'var(--em-bg-card)',
          borderRadius: 10, border: '1px solid var(--em-border-default)',
          boxShadow: 'var(--em-shadow-sm)', overflow: 'hidden', marginBottom: 8,
        }}>
          <div style={{ width: 4, flexShrink: 0, backgroundColor: team.team_color || 'var(--em-accent)' }} />
          <div style={{ flex: 1, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--em-text-primary)' }}>{formatDate(e.start_at)}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--em-text-primary)', marginLeft: 4 }}>{formatTime(e.start_at)}</span>
            </div>
            <div style={{ fontSize: 15, color: 'var(--em-text-primary)', marginTop: 2 }}>
              {e.opponent ? `vs. ${e.opponent}` : e.title || TYPE_LABELS[e.event_type] || 'Event'}
            </div>
            {e.location_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--em-text-tertiary)', marginTop: 2 }}>
                <MapPin size={11} strokeWidth={1.75} />{e.location_name}
              </div>
            )}
          </div>
        </div>
      ))}

      {events.length > 0 && (
        <button type="button" onClick={() => downloadTeamIcs(team.name, events)} className="sf-press"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', minHeight: 44, marginTop: 16, borderRadius: 10,
            border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
            color: 'var(--em-accent)', fontSize: 15, fontWeight: 500,
          }}>
          <Download size={16} strokeWidth={1.75} />
          Download Schedule (.ics)
        </button>
      )}

      {events.length > 0 && (
        <button type="button" onClick={() => setShowSubscribe(true)} className="sf-press"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', minHeight: 44, marginTop: 8, borderRadius: 10,
            border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
            color: 'var(--em-accent)', fontSize: 15, fontWeight: 500,
          }}>
          <Calendar size={16} strokeWidth={1.75} />
          Subscribe to Calendar
        </button>
      )}

      <BottomSheet open={showSubscribe} onClose={() => setShowSubscribe(false)} initialHeight="30%">
        <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--em-text-primary)', marginBottom: 16 }}>Subscribe to Calendar</h3>
        <a href={`webcal://${window.location.host}/api/calendar?team=${teamId}`}
          style={calOptStyle} aria-label="Subscribe via Apple Calendar">
          <Calendar size={20} strokeWidth={1.75} style={{ color: 'var(--em-accent)' }} />
          <span>Apple Calendar</span>
        </a>
        <a href={`https://calendar.google.com/calendar/r?cid=webcal://${window.location.host}/api/calendar?team=${teamId}`}
          target="_blank" rel="noopener noreferrer" style={calOptStyle} aria-label="Subscribe via Google Calendar">
          <Calendar size={20} strokeWidth={1.75} style={{ color: 'var(--em-accent)' }} />
          <span>Google Calendar</span>
        </a>
      </BottomSheet>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--em-text-tertiary)' }}>
        Powered by Ember
      </div>
    </div>
  );
}

const calOptStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  width: '100%', minHeight: 44, padding: '0 16px', borderRadius: 10,
  border: '1px solid var(--em-border-default)', backgroundColor: 'var(--em-bg-card)',
  color: 'var(--em-text-primary)', fontSize: 15, fontWeight: 500,
  textDecoration: 'none', marginBottom: 8,
};
