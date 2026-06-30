import { useEffect, useState } from 'react';
import logoUrl from '../../assets/aau/aster-constellation-480.png';
import { useTrackedTeams } from '../../hooks/useTrackedTeams';
import { useTrackedSchedules } from '../../hooks/useTrackedSchedules';
import { getWeatherForTime, useWeather } from '../../hooks/useWeather';
import { weatherAdvice } from '../../lib/aau/weatherAdvice';
import { formatTime } from '../../lib/formatters';

// The no-login Hub front-screen hero (R1·PR-A). Two states, both gold-on-navy
// to mirror the authenticated app's schedule hero:
//   • a tracked team has an upcoming game → a live NEXT-UP countdown + venue +
//     game-day weather advice (the soonest game across ALL tracked teams);
//   • otherwise → a branded welcome with the constellation mark + tagline.
// --as-* tokens only; the mark is a Vite-imported asset (fingerprinted, so it
// can't hit the broken-<img> path a raw public/ path can).

const NY_TZ = 'America/New_York';
const heroStyle = {
  backgroundColor: 'var(--as-header)', borderRadius: 16, padding: 20,
  backgroundImage: 'radial-gradient(120% 80% at 50% 0%, rgba(232,117,32,0.16), transparent 60%)',
};
const eyebrow = { margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--as-accent)' };

function gameDay(startAt) {
  return new Date(startAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: NY_TZ });
}

function countdownParts(ms) {
  const s = Math.max(0, ms);
  return { d: Math.floor(s / 86400000), h: Math.floor((s % 86400000) / 3600000), m: Math.floor((s % 3600000) / 60000) };
}

function Block({ n, label }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 44 }}>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: 'var(--as-text-on-dark)', fontVariantNumeric: 'tabular-nums' }}>{String(n).padStart(2, '0')}</div>
      <div style={{ marginTop: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--as-accent)' }}>{label}</div>
    </div>
  );
}

export default function AauUpNextHero() {
  const teams = useTrackedTeams();
  const { nextGame, afterThis } = useTrackedSchedules(teams.map((t) => t.teamKey));
  const weather = useWeather(nextGame?.venue?.lat, nextGame?.venue?.lng);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!nextGame) return undefined;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [nextGame]);

  if (!nextGame) {
    return (
      <section style={{ ...heroStyle, textAlign: 'center', padding: '28px 20px' }}>
        <img src={logoUrl} alt="" width={84} height={105} style={{ display: 'block', margin: '0 auto 12px', height: 'auto' }} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--as-accent)' }}>Aster Sports AAU</h1>
        <p style={{ margin: '8px auto 0', maxWidth: 320, fontSize: 15, lineHeight: 1.5, color: 'var(--as-text-on-dark)' }}>
          Live brackets, standings &amp; schedules — free, no account needed.
        </p>
      </section>
    );
  }

  const { d, h, m } = countdownParts(new Date(nextGame.startAt).getTime() - now);
  const matchup = `${nextGame.isHome ? 'vs' : '@'} ${nextGame.opponent || 'TBD'}`;
  const hour = getWeatherForTime(weather, nextGame.startAt); // reduce over the forecast once
  const advice = weatherAdvice(hour);

  return (
    <>
    <section style={heroStyle} aria-label="Next tracked game">
      <p style={eyebrow}>★ Next up · {nextGame.trackedTeamName || 'Your team'}</p>
      <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--as-text-on-dark)' }}>
        {matchup}
      </h1>
      <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--as-text-on-dark)', opacity: 0.85 }}>
        {gameDay(nextGame.startAt)} · {formatTime(nextGame.startAt)}{nextGame.venue?.name ? ` · ${nextGame.venue.name}` : ''}
      </p>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-start' }}>
        <Block n={d} label="Days" />
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--as-accent)', lineHeight: 1.1 }}>:</div>
        <Block n={h} label="Hrs" />
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--as-accent)', lineHeight: 1.1 }}>:</div>
        <Block n={m} label="Min" />
      </div>

      {hour && (
        <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--as-text-on-dark)' }}>
          <span aria-hidden="true">{hour.icon}</span> {hour.temp}° {hour.label}{advice ? ` · ${advice}` : ''}
        </p>
      )}
    </section>

    {afterThis.length > 0 && (
      <div style={{ marginTop: 10 }} aria-label="Games after the next one">
        <p style={{ ...eyebrow, color: 'var(--as-text-tertiary)', margin: '0 0 6px' }}>After that</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {afterThis.map((g) => (
            <div key={g.gameId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', backgroundColor: 'var(--as-bg-card)', border: '1px solid var(--as-border-default)', borderRadius: 10, boxShadow: 'var(--as-shadow-sm)' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--as-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {g.isHome ? 'vs' : '@'} {g.opponent || 'TBD'}
                </p>
                {g.trackedTeamName && <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--as-text-secondary)' }}>{g.trackedTeamName}</p>}
              </div>
              <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: 'var(--as-text-primary)', whiteSpace: 'nowrap' }}>
                {gameDay(g.startAt)} · {formatTime(g.startAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
    </>
  );
}
