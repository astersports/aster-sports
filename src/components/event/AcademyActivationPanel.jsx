import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import CollapsibleSection from '../shared/CollapsibleSection';
import Badge from '../shared/Badge';

export default function AcademyActivationPanel({ eventId, teamId }) {
  const [players, setPlayers] = useState([]);
  const [activated, setActivated] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !teamId) return;
    let cancelled = false;
    (async () => {
      // §11.5 doctrine: team_players is canonical for "kids on a team right
      // now" + jersey_number. .eq('status', 'active') is MCP-verified
      // equivalent to roster_members .is('left_at', null) per PR #125.
      // Keeping the players(member_type) JS filter as a redundant safety
      // check; team_players.roster_type='futures' would also work but
      // member_type stays the canonical player-level signal.
      const [rosterRes, actRes] = await Promise.all([
        supabase
          .from('team_players')
          .select('player_id, jersey_number, players(id, first_name, last_name, member_type)')
          .eq('team_id', teamId)
          .eq('status', 'active'),
        supabase
          .from('player_activations')
          .select('player_id')
          .eq('event_id', eventId),
      ]);
      if (cancelled) return;
      const academy = (rosterRes.data || [])
        .filter((r) => r.players?.member_type === 'futures_academy')
        .map((r) => ({ id: r.player_id, firstName: r.players.first_name, lastName: r.players.last_name, jersey: r.jersey_number }));
      setPlayers(academy);
      setActivated(new Set((actRes.data || []).map((a) => a.player_id)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eventId, teamId]);

  const toggle = useCallback(async (playerId) => {
    const wasActive = activated.has(playerId);
    setActivated((prev) => {
      const next = new Set(prev);
      wasActive ? next.delete(playerId) : next.add(playerId);
      return next;
    });
    const { error } = wasActive
      ? await supabase.from('player_activations').delete().eq('event_id', eventId).eq('player_id', playerId)
      : await supabase.from('player_activations').insert({ event_id: eventId, player_id: playerId });
    if (error) {
      setActivated((prev) => {
        const next = new Set(prev);
        wasActive ? next.add(playerId) : next.delete(playerId);
        return next;
      });
    }
  }, [activated, eventId]);

  if (loading || players.length === 0) return null;

  return (
    <CollapsibleSection title="Academy Players" sectionKey="academy" defaultOpen={false} count={`${activated.size}/${players.length}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px 8px' }}>
        {players.map((p) => {
          const isOn = activated.has(p.id);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, padding: '8px 12px', backgroundColor: 'var(--em-bg-card)', border: '1px solid var(--em-border-default)', borderRadius: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--em-text-primary)' }}>
                  {p.firstName} {p.lastName}
                  {p.jersey && <span style={{ marginLeft: 6, fontSize: 13, color: 'var(--em-text-tertiary)' }}>#{p.jersey}</span>}
                </div>
              </div>
              <Badge variant="academy">Academy</Badge>
              <button
                type="button"
                aria-label={`${isOn ? 'Deactivate' : 'Activate'} ${p.firstName} ${p.lastName}`}
                onClick={() => toggle(p.id)}
                className="sf-press"
                style={{
                  minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  backgroundColor: isOn ? 'var(--em-accent)' : 'transparent',
                  color: isOn ? 'var(--em-text-inverse)' : 'var(--em-text-secondary)',
                  outline: isOn ? 'none' : '1.5px solid var(--em-border-default)',
                  transition: 'background-color 150ms ease, color 150ms ease',
                }}
              >
                {isOn ? 'Active' : 'Activate'}
              </button>
            </div>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
