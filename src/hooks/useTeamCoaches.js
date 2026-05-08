import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Returns coaches assigned to a team (team_staff rows) joined with their
// staff_profiles for display_name + phone. Used by the briefing composer
// to default the contact-footer picker. Profiles may be missing if the
// coach hasn't filled theirs out yet — display_name + phone come back
// null and the briefing footer drops them.

export function useTeamCoaches(teamId) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!teamId) { setCoaches([]); setLoading(false); setError(null); return; }
      setLoading(true); setError(null);

      const { data: staffRows, error: staffErr } = await supabase
        .from('team_staff')
        .select('user_id, role')
        .eq('team_id', teamId);
      if (cancelled) return;
      if (staffErr) { setError(staffErr); setCoaches([]); setLoading(false); return; }

      const userIds = (staffRows || []).map((r) => r.user_id);
      if (userIds.length === 0) { setCoaches([]); setLoading(false); return; }

      const { data: profiles, error: profErr } = await supabase
        .from('staff_profiles')
        .select('user_id, display_name, phone')
        .in('user_id', userIds);
      if (cancelled) return;
      if (profErr) { setError(profErr); setCoaches([]); setLoading(false); return; }

      const profileById = new Map((profiles || []).map((p) => [p.user_id, p]));
      const merged = (staffRows || []).map((s) => {
        const p = profileById.get(s.user_id) || {};
        return {
          user_id: s.user_id,
          role: s.role,
          display_name: p.display_name || null,
          phone: p.phone || null,
        };
      });
      setCoaches(merged);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [teamId]);

  return { coaches, loading, error };
}
