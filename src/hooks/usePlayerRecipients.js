import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Player-scoped guardian recipients. Mirrors useTeamRecipients shape so
// the same SendConfirmDialog primitive works without modification.
// Always appends admin@legacyhoopers.org as a BCC audit copy unless it's
// already a real recipient.
//
// Returns: [{ guardian_id, email, name, children: [{first_name,last_name}], is_admin_copy? }]

const ADMIN_BCC_EMAIL = 'admin@legacyhoopers.org';

export function usePlayerRecipients(playerId) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!playerId) { setRecipients([]); setLoading(false); setError(null); return; }
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('player_guardians')
        .select(`
          player_id,
          guardians!inner ( id, first_name, last_name, email ),
          players!inner ( first_name, last_name )
        `)
        .eq('player_id', playerId);
      if (cancelled) return;
      if (err) { setError(err); setRecipients([]); setLoading(false); return; }
      const playerRow = data?.[0]?.players;
      const child = playerRow
        ? { first_name: playerRow.first_name, last_name: playerRow.last_name }
        : null;
      const byGuardian = new Map();
      for (const row of data || []) {
        const g = row.guardians;
        if (!g?.email) continue;
        if (byGuardian.has(g.id)) continue;
        byGuardian.set(g.id, {
          guardian_id: g.id,
          email: g.email,
          name: `${g.first_name || ''} ${g.last_name || ''}`.trim() || g.email,
          children: child ? [child] : [],
        });
      }
      const sorted = [...byGuardian.values()].sort((a, b) => a.name.localeCompare(b.name));
      const withAdminBcc = sorted.some((r) => r.email === ADMIN_BCC_EMAIL)
        ? sorted
        : [...sorted, { guardian_id: 'admin-bcc', email: ADMIN_BCC_EMAIL, name: 'Admin (audit copy)', children: [], is_admin_copy: true }];
      setRecipients(withAdminBcc);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [playerId]);

  return { recipients, loading, error };
}
