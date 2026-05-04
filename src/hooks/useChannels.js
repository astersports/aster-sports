import { useMemo } from 'react';
import { useTeams } from './useTeams';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../lib/permissions';

export function useChannels() {
  const { orgId, role, myTeamIds } = useAuth();
  const { teams, loading } = useTeams(orgId);

  const channels = useMemo(() => {
    const list = [{ key: 'announcements', label: 'Announcements', channel: 'announcement', teamId: null }];
    const visible = isStaff(role) ? teams : teams.filter((t) => myTeamIds.includes(t.id));
    visible.forEach((t) => {
      list.push({ key: `team-${t.id}`, label: t.name, channel: 'team', teamId: t.id, color: t.team_color });
    });
    return list;
  }, [teams, role, myTeamIds]);

  return { channels, loading };
}
