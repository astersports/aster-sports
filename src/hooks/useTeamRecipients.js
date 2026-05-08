import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Loads guardian recipients for a team via the team_players → players
// → player_guardians → guardians chain. Filters to active players +
// guardians with a non-empty email. Dedupes by guardian.id (one
// guardian can have multiple kids on the same team).
//
// Always appends admin@legacyhoopers.org as a BCC safety copy so the
// operator inbox holds an audit copy of every real send. Deduped if
// admin email already appears in the real recipient set (can happen
// if an admin is also a guardian). The is_admin_copy flag is consumed
// downstream by the count UI (excluded from "Send to N families") and
// by the test-toggle override (replaced wholesale).
//
// Shape returned per recipient:
// { guardian_id, email, name, children: [{ first_name, last_name }],
//   is_admin_copy?: true }

const ADMIN_BCC_EMAIL = 'admin@legacyhoopers.org';

export function useTeamRecipients(teamId) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!teamId) {
        setRecipients([]); setLoading(false); setError(null);
        return;
      }
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('team_players')
        .select(`
          status,
          players!inner (
            id, first_name, last_name,
            player_guardians (
              guardians!inner ( id, first_name, last_name, email )
            )
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');
      if (cancelled) return;
      if (err) { setError(err); setRecipients([]); setLoading(false); return; }

      const byGuardian = new Map();
      for (const row of data || []) {
        const player = row.players;
        if (!player) continue;
        for (const pg of player.player_guardians || []) {
          const g = pg.guardians;
          if (!g?.email) continue;
          const child = { first_name: player.first_name, last_name: player.last_name };
          const existing = byGuardian.get(g.id);
          if (existing) {
            if (!existing.children.some((c) => c.first_name === child.first_name && c.last_name === child.last_name)) {
              existing.children.push(child);
            }
          } else {
            byGuardian.set(g.id, {
              guardian_id: g.id,
              email: g.email,
              name: `${g.first_name || ''} ${g.last_name || ''}`.trim() || g.email,
              children: [child],
            });
          }
        }
      }
      const sorted = [...byGuardian.values()].sort((a, b) => a.name.localeCompare(b.name));
      const withAdminBcc = sorted.some((r) => r.email === ADMIN_BCC_EMAIL)
        ? sorted
        : [...sorted, { guardian_id: 'admin-bcc', email: ADMIN_BCC_EMAIL, name: 'Admin (audit copy)', children: [], is_admin_copy: true }];
      setRecipients(withAdminBcc);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [teamId]);

  return { recipients, loading, error };
}
