// PR-D — composeCustomMessage tags the narrative section with the token
// kinds present in the body (body_token_placeholders), in BODY_TOKENS order,
// so the send pipeline can resolve URLs (AP #29). Compose stays pure: it
// does NOT mint or resolve URLs.

import { describe, expect, it } from 'vitest';
import { composeCustomMessage } from '../customMessage';

describe('composeCustomMessage — body token placeholders', () => {
  it('no tokens: narrative carries no body_token_placeholders', () => {
    const { sections } = composeCustomMessage({ subject: 'Hi', body_text: 'Plain message' });
    const narrative = sections.find((s) => s.kind === 'stats_narrative');
    expect(narrative.body_token_placeholders).toBeUndefined();
  });

  it('tags placeholders for the token kinds present, in BODY_TOKENS order', () => {
    const { sections } = composeCustomMessage({
      subject: 'Hi',
      body_text: 'Directions {{token:directions_url}} and RSVP {{token:rsvp_url}} please',
    });
    const narrative = sections.find((s) => s.kind === 'stats_narrative');
    // BODY_TOKENS order is rsvp, schedule, directions
    expect(narrative.body_token_placeholders).toEqual(['rsvp', 'directions']);
  });

  it('does NOT resolve or mint URLs at compose time (no body_token_urls)', () => {
    const { sections } = composeCustomMessage({ subject: 'Hi', body_text: 'RSVP {{token:rsvp_url}}' });
    const narrative = sections.find((s) => s.kind === 'stats_narrative');
    expect(narrative.body_token_urls).toBeUndefined();
    expect(narrative.body).toContain('{{token:rsvp_url}}');
  });

  it('ignores an unknown token kind (latest_briefing has no source)', () => {
    const { sections } = composeCustomMessage({ subject: 'Hi', body_text: 'See {{token:latest_briefing_url}}' });
    const narrative = sections.find((s) => s.kind === 'stats_narrative');
    expect(narrative.body_token_placeholders).toBeUndefined();
  });
});
