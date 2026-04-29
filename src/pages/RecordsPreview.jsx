import React from 'react';
import BroadcastHeroHeader from '../components/broadcast/BroadcastHeroHeader';
import StatHeroBar from '../components/broadcast/StatHeroBar';
import TeamIdentityCard from '../components/broadcast/TeamIdentityCard';
import TournamentCard from '../components/broadcast/TournamentCard';
import GameLogRow from '../components/broadcast/GameLogRow';
import { teamColors } from '../lib/design-tokens';

/**
 * Wave 3a verification page. Renders the 5 broadcast components with
 * Spring 2026 fixture data. The fixture matches the verified Y2b
 * game_results backfill and EMBER_MASTER_INDEX_v3.md Section 10 page 46.
 *
 * Wave 3b will replace the fixture with live useTeamRecords data.
 */

const TEAMS = [
  { number: 1, name: '11U Girls', meta: 'AAU · Zero Gravity', record: '5-2', streak: 'W1',
    stats: { ppg: 27.6, allowed: 21.3, diff: 6.3, winPct: 71, gamesPlayed: 7 } },
  { number: 2, name: '10U Black', meta: 'AAU · Zero Gravity', record: '5-4', streak: 'L4',
    stats: { ppg: 31.8, allowed: 27.8, diff: 4.0, winPct: 56, gamesPlayed: 9 } },
  { number: 3, name: '10U Blue',  meta: 'League Play',         record: '1-1', streak: 'L1',
    stats: { ppg: 29.0, allowed: 26.5, diff: 2.5, winPct: 50, gamesPlayed: 2 } },
  { number: 4, name: '9U Boys',   meta: 'League Play',         record: '0-1', streak: 'L1',
    stats: { ppg: 16.0, allowed: 24.0, diff: -8.0, winPct: 0,  gamesPlayed: 1 } },
  { number: 5, name: '8U Boys',   meta: 'AAU · Zero Gravity', record: '3-5', streak: 'L3',
    stats: { ppg: 17.3, allowed: 27.9, diff: -10.6, winPct: 38, gamesPlayed: 8 } },
];

const SAMPLE_GAMES = [
  { result: 'W', date: 'Apr 11', opponent: 'NY Rens',          score: '32-26' },
  { result: 'W', date: 'Apr 12', opponent: 'PSA Cardinals',    score: '28-24' },
  { result: 'L', date: 'Apr 18', opponent: 'Riverside Hawks',  score: '22-31' },
  { result: 'W', date: 'Apr 19', opponent: 'NY Lightning',     score: '34-29' },
];

export default function RecordsPreview() {
  return (
    <div className="bc-root">
      <BroadcastHeroHeader
        eyebrow="Spring 2026 · Legacy Hoopers"
        headline="THE <b>RECORDS</b>"
        sub="Five teams. One season. Every result, every streak, every stat."
        tags={['Spring 2026', '5 Teams', '27 Games']}
        lastUpdated="Apr 29, 2026"
      />

      <StatHeroBar
        items={[
          { value: 2,  label: 'Tournament Champs',   variant: 'gold' },
          { value: 2,  label: 'Nationals Qualified', variant: 'green' },
          { value: 5,  label: 'Active Teams' },
        ]}
      />

      <div className="bc-page">
        <section className="bc-section">
          <div className="bc-sec-eye">By Team</div>
          <h2 className="bc-sec-h2">SEASON <b>SNAPSHOT</b></h2>
          {TEAMS.map((t) => (
            <TeamIdentityCard
              key={t.name}
              number={t.number}
              name={t.name}
              meta={t.meta}
              teamColor={teamColors[t.name]}
              record={t.record}
              streak={t.streak}
              stats={t.stats}
            />
          ))}
        </section>

        <section className="bc-section">
          <div className="bc-sec-eye">Tournaments</div>
          <h2 className="bc-sec-h2">RUN OF <b>PLAY</b></h2>
          <TournamentCard
            name="ZG Chase for the Chain NY"
            dateRange="Apr 11-12"
            location="Westchester County, NY"
            status="complete"
            results={[
              { team: '11U Girls', badge: 'Champions' },
              { team: '10U Black', badge: 'Champions' },
              { team: '8U Boys',   badge: 'Finalists' },
            ]}
          />
          <TournamentCard
            name="NY Metro Showdown"
            dateRange="Apr 18-19"
            location="Westchester County, NY"
            status="complete"
            results={[
              { team: '11U Girls' },
              { team: '10U Black' },
              { team: '8U Boys' },
            ]}
          />
          <TournamentCard
            name="Rumble for the Ring CT"
            dateRange="May 16-17"
            location="Fairfield County, CT"
            status="next"
          />
          <TournamentCard
            name="ZG Nationals"
            dateRange="May 29 - Jun 7"
            location="Massachusetts"
            status="upcoming"
            results={[
              { team: '11U Girls', badge: 'Qualified' },
              { team: '10U Black', badge: 'Qualified' },
            ]}
          />
        </section>

        <section className="bc-section" style={{ paddingBottom: 64 }}>
          <div className="bc-sec-eye">Recent Results · 11U Girls</div>
          <h2 className="bc-sec-h2">GAME <b>LOG</b></h2>
          {SAMPLE_GAMES.map((g, i) => (
            <GameLogRow key={i} {...g} />
          ))}
        </section>
      </div>
    </div>
  );
}
