// Pure helpers for the no-login Hub search (R1·PR-A). IO-free (AP #27) so the
// unit test imports them without the supabase-client init.
//
// search_public_aau returns ONE row per (team × tournament): the same real team
// (same teamKey = name:gender:grade) appears once for every tournament it played
// in. Rendered raw, a parent sees "Legacy Hoopers" six times and — because every
// card shares one track key — tapping a duplicate's Track button TOGGLES the
// team back OFF. Dedup to one card per distinct team, carrying a tournamentCount.

export function dedupeTeams(teams) {
  const out = [];
  const idx = new Map(); // teamKey -> index in out
  for (const t of teams || []) {
    if (t?.teamKey && idx.has(t.teamKey)) {
      out[idx.get(t.teamKey)].tournamentCount += 1;
      continue;
    }
    const entry = { ...t, tournamentCount: 1 };
    if (t?.teamKey) idx.set(t.teamKey, out.length);
    out.push(entry);
  }
  return out;
}

const GENDER = { M: 'Boys', B: 'Boys', F: 'Girls', W: 'Girls', G: 'Girls' };

// "Legacy Hoopers · Girls 5th" — a distinguishing label so tracked entries for
// the same club but different age/gender don't all read "Legacy Hoopers". Falls
// back to the bare name when gender/grade are absent.
export function aauTeamLabel(t) {
  const name = t?.name || 'Team';
  const suffix = [GENDER[t?.gender] || null, t?.gradeLabel || null].filter(Boolean).join(' ');
  return suffix ? `${name} · ${suffix}` : name;
}
