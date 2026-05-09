// Kind composer — game_recap. Per-family email after a regular-season
// game completes. Score, our highlights, opponent highlights, player
// of game (rendered as text line), coach note, signoff, footer.
//
// Body fields:
//   { score: { ours: int, theirs: int },
//     our_highlights: text, opp_highlights: text,
//     player_of_game_name: text, coach_note: text }
//
// Score visuals (color-coded W/L block) deferred to a polish PR.
// v1 renders score as a stats_narrative line so the kind ships
// end-to-end now.

import { renderSections, renderSectionsPlainText } from '../composer';

const ORG_NAME_DEFAULT = 'Legacy Hoopers';
const ORG_WEBSITE_DEFAULT = 'https://www.legacyhoopers.org/';
const ORG_CONTACT_DEFAULT = 'info@legacyhoopers.org';
const ORG_LOGO_DEFAULT = 'https://skyfire-app.vercel.app/knight-logo-240.png';

function scoreLine(score, teamName, opponent) {
  const ours = score?.ours ?? null;
  const theirs = score?.theirs ?? null;
  if (ours == null || theirs == null) return '';
  const tag = ours > theirs ? 'W' : (ours < theirs ? 'L' : 'T');
  const team = teamName || 'Legacy Hoopers';
  const opp = opponent || 'opponent';
  return `Final: ${team} ${ours} – ${opp} ${theirs} (${tag})`;
}

function buildSubject({ teamName, opponent, score }) {
  const opp = opponent || 'opponent';
  if (score?.ours != null && score?.theirs != null) {
    return `Recap — ${teamName || 'Legacy Hoopers'} ${score.ours}-${score.theirs} vs ${opp}`;
  }
  return `Recap — ${teamName || 'game'} vs ${opp}`;
}

export function composeGameRecap(data = {}) {
  const {
    teamName, opponent, our_highlights = '', opp_highlights = '',
    player_of_game_name = '', coach_note = '',
    signoff_message = '', coaches = [],
    orgName = ORG_NAME_DEFAULT, eyebrowLink = ORG_WEBSITE_DEFAULT,
    contactEmail = ORG_CONTACT_DEFAULT, logoUrl = ORG_LOGO_DEFAULT,
  } = data;

  const sections = [
    { kind: 'header', eyebrow: `${orgName} · GAME RECAP`, eyebrow_link: eyebrowLink, headline: 'GAME RECAP', goldStripe: true },
  ];
  const scoreText = scoreLine(data.score, teamName, opponent);
  if (scoreText) sections.push({ kind: 'stats_narrative', body: scoreText });
  if (our_highlights?.trim()) sections.push({ kind: 'stats_narrative', body: our_highlights.trim() });
  if (opp_highlights?.trim()) sections.push({ kind: 'stats_narrative', body: opp_highlights.trim() });
  if (player_of_game_name?.trim()) sections.push({ kind: 'stats_narrative', body: `Player of the game: ${player_of_game_name.trim()}` });
  if (coach_note?.trim()) sections.push({ kind: 'stats_narrative', body: coach_note.trim() });
  if (signoff_message?.trim() || coaches.length) {
    sections.push({ kind: 'signoff', prose: signoff_message?.trim() || '', coaches: coaches.map((c) => ({ display_name: c.display_name || '', title: c.title || '', phone: c.phone || '' })) });
  }
  sections.push({ kind: 'footer', logoUrl, orgName, websiteUrl: eyebrowLink, contactEmail });

  const html = '<div style="max-width:600px;margin:0 auto;background-color:#ffffff;font-family:Inter,system-ui,sans-serif;padding:0 0 24px 0;">'
    + renderSections(sections) + '</div>';
  const plainText = renderSectionsPlainText(sections);
  return { subject: buildSubject({ teamName, opponent, score: data.score }), html, plainText, sections };
}

export default composeGameRecap;
