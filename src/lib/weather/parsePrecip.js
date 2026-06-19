// Parse the daily-forecast `rn` string ("55% rain" / "80% snow" / "96% storms")
// into { pct, kind } for the precipitation heads-up banner. `rn` is built by
// fetchTournamentWeather as `${pct}% ${rainWord(code)}`, so the word already
// distinguishes rain / snow / storms. Pure; returns { pct: null, kind: null }
// when rn is empty or unparseable (never fabricate).
export function parsePrecip(rn) {
  if (typeof rn !== 'string') return { pct: null, kind: null };
  const m = rn.match(/^(\d+)%\s*([a-z]+)/i);
  if (!m) return { pct: null, kind: null };
  return { pct: Number(m[1]), kind: m[2].toLowerCase() };
}
