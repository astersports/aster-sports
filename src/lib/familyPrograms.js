// Pure assembly for the parent "My Family" surface (PR-B1). No IO (AP#27) so the
// enrollment/balance/discovery shaping is unit-testable. One balance source:
// family_balances (parent-own); a child enrolled in a program with no visible
// own-balance row renders the "managed by the registering parent" treatment
// (the co-guardian gap — a leak-free deferral, architect-ruled, not a number).

export function programWindowOpen(program, now = new Date()) {
  const t = now.getTime();
  const opens = program.reg_opens_at ? new Date(program.reg_opens_at).getTime() : null;
  const closes = program.reg_closes_at ? new Date(program.reg_closes_at).getTime() : null;
  return (!opens || t >= opens) && (!closes || t < closes);
}

// Names of the children grade-eligible for a program's divisions. No grade bands
// (or no divisions) → all children. May return [] (program shown informationally).
export function eligibleChildNames(kids, program) {
  const bands = (program.divisions || []).filter((d) => d.grade_min != null || d.grade_max != null);
  if (bands.length === 0) return (kids || []).map((k) => k.first_name);
  return (kids || [])
    .filter((k) => k.grade != null && bands.some((d) =>
      (d.grade_min == null || k.grade >= d.grade_min) && (d.grade_max == null || k.grade <= d.grade_max)))
    .map((k) => k.first_name);
}

// children: [{id, first_name, last_name, grade}]  roster: [{player_id, team_id}]
// teams: [{id, name, team_color, season_id}]  regs: [{player_id, status, program_id}]
// balances: family_balances rows (parent-own)  programs: org published+all programs
export function assembleFamily({ kids = [], roster = [], teams = [], regs = [], balances = [], programs = [], now = new Date() }) {
  const teamById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const progById = Object.fromEntries(programs.map((p) => [p.id, p]));
  const balBySeason = Object.fromEntries(balances.map((b) => [b.season_id, b]));
  const regStatus = {};
  for (const r of regs) regStatus[`${r.player_id}:${r.program_id}`] = r.status;

  const children = kids.map((k) => {
    const programIds = new Set();
    const enrollments = [];
    // imported enrollment: one row per team (team name + its program/season)
    for (const rm of roster.filter((r) => r.player_id === k.id)) {
      const team = teamById[rm.team_id];
      const prog = team && progById[team.season_id];
      if (!prog) continue;
      programIds.add(prog.id);
      enrollments.push({
        programId: prog.id, teamName: team.name, programName: prog.name,
        programType: prog.program_type, teamColor: team.team_color,
        status: regStatus[`${k.id}:${prog.id}`] || 'enrolled',
      });
    }
    // funnel registrations for a program with no team row yet
    for (const r of regs.filter((x) => x.player_id === k.id)) {
      const prog = progById[r.program_id];
      if (!prog || enrollments.some((e) => e.programId === prog.id)) continue;
      programIds.add(prog.id);
      enrollments.push({
        programId: prog.id, teamName: null, programName: prog.name,
        programType: prog.program_type, teamColor: null, status: r.status,
      });
    }
    return { id: k.id, firstName: k.first_name, lastName: k.last_name, grade: k.grade, enrollments };
  });

  const enrolled = new Set(children.flatMap((c) => c.enrollments.map((e) => e.programId)));

  // FAMILY-LEVEL balances, one per distinct enrolled program (an account is per
  // family per program, not per child). Own family_balances row → the number;
  // a SEASON enrolled with no own row → "managed by the registering parent"
  // (the co-guardian gap). A non-season program with no own row shows no balance
  // line (it may be free / not billed) — avoids a false managed-by.
  const familyBalances = [];
  for (const pid of enrolled) {
    const prog = progById[pid];
    const b = balBySeason[pid];
    if (b) familyBalances.push({ programId: pid, programName: prog?.name, balance: b, managed: false });
    else if (prog?.program_type === 'season') familyBalances.push({ programId: pid, programName: prog?.name, balance: null, managed: true });
  }
  const openPrograms = programs
    .filter((p) => p.is_published && programWindowOpen(p, now) && !enrolled.has(p.id))
    .map((p) => ({
      id: p.id, name: p.name, programType: p.program_type, slug: p.public_slug,
      closesAt: p.reg_closes_at, eligibleChildren: eligibleChildNames(kids, p),
    }));

  return { children, familyBalances, openPrograms };
}
