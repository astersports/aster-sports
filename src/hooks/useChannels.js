import { useMemo } from 'react';
import { useTeams } from './useTeams';
import { useAuth } from '../context/AuthContext';
import { useSeason } from '../context/SeasonContext';
import { isStaff } from '../lib/permissions';

export function useChannels() {
  const { orgId, role, myTeamIds } = useAuth();
  const { activeSeason } = useSeason();
  const { teams, loading } = useTeams(orgId);

  const channels = useMemo(() => {
    const list = [{ key: 'announcements', label: 'Announcements', channel: 'announcement', teamId: null }];
    // #4 (Frank 2026-06-19): channels for the ACTIVE season only — completed
    // seasons' teams were piling up in the list. Falls back to all teams when
    // no active season is known (don't empty the list).
    const seasonTeams = activeSeason?.id ? teams.filter((t) => t.season_id === activeSeason.id) : teams;
    const visible = isStaff(role) ? seasonTeams : seasonTeams.filter((t) => myTeamIds.includes(t.id));
    visible.forEach((t) => {
      list.push({ key: `team-${t.id}`, label: t.name, channel: 'team', teamId: t.id, color: t.team_color });
    });
    return list;
  }, [teams, role, myTeamIds, activeSeason]);

  return { channels, loading };
}
