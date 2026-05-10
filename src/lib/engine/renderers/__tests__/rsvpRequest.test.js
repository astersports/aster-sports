// Wave 4.2-A-8b-b — rsvp_request atomic renderer unit tests.

import { describe, expect, it } from 'vitest';
import render from '../rsvpRequest';

const post = {
  kind: 'rsvp_request',
  kid_first_name: 'Hudson',
  player_id: 'p-1',
  team_name: '10U Black',
  team_color: '#4a8fd4',
  event_label: 'Skills Lab',
  urgency_phrase: 'Tomorrow (Monday) at 7:35 PM',
  rsvp_token_urls: {
    going: 'https://x.test/?p=p-1&a=going',
    maybe: 'https://x.test/?p=p-1&a=maybe',
    not_going: 'https://x.test/?p=p-1&a=not_going',
  },
};

describe('rsvp_request renderer', () => {
  it('1. renders all 3 buttons with substituted URLs', () => {
    const { html } = render(post);
    expect(html).toContain('https://x.test/?p=p-1&amp;a=going');
    expect(html).toContain('https://x.test/?p=p-1&amp;a=maybe');
    expect(html).toContain('https://x.test/?p=p-1&amp;a=not_going');
    expect(html).toContain('GOING');
    expect(html).toContain('MAYBE');
    expect(html).toContain("CAN'T MAKE IT");
  });

  it('2. renders kid_first_name in heading', () => {
    const { html } = render(post);
    expect(html).toContain('RSVP for Hudson');
  });

  it('3. renders team_name + event_label + urgency_phrase in sub-context', () => {
    const { html } = render(post);
    expect(html).toContain('10U Black');
    expect(html).toContain('Skills Lab');
    expect(html).toContain('Tomorrow (Monday) at 7:35 PM');
  });

  it('4. fail-loud fallback: rsvp_token_urls absent -> hrefs render literal {{rsvp_*_url}}', () => {
    const pre = { ...post, rsvp_token_urls: undefined, rsvp_token_placeholders: { going: '{{rsvp_going_url}}', maybe: '{{rsvp_maybe_url}}', not_going: '{{rsvp_not_going_url}}' } };
    const { html, plainText } = render(pre);
    expect(html).toContain('{{rsvp_going_url}}');
    expect(html).toContain('{{rsvp_maybe_url}}');
    expect(html).toContain('{{rsvp_not_going_url}}');
    expect(plainText).toContain('Going: {{rsvp_going_url}}');
  });
});
