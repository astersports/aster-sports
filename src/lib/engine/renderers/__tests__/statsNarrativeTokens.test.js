// PR-D — statsNarrative token rendering (the .prevbtn email button) with the
// AP #29 fail-loud fallback. The plain-prose path is covered elsewhere; this
// file locks the token behavior.

import { describe, expect, it } from 'vitest';
import render from '../statsNarrative';

describe('statsNarrative — body action tokens', () => {
  it('plain prose (no token) renders escaped body, no button', () => {
    const { html, plainText } = render({ kind: 'stats_narrative', body: 'Hi <there>' });
    expect(html).toContain('Hi &lt;there&gt;');
    expect(html).not.toContain('<a ');
    expect(plainText).toBe('Hi <there>');
  });

  it('resolved token renders a cobalt pill button with the resolved href', () => {
    const section = {
      kind: 'stats_narrative',
      body: 'Quick one. {{token:rsvp_url}} so we have a count.',
      body_token_urls: { rsvp: 'https://h.test/r?t=abc&action=going' },
    };
    const { html, plainText } = render(section);
    expect(html).toContain('<a href="https://h.test/r?t=abc&amp;action=going"');
    expect(html).toContain('background-color:#151525');
    expect(html).toContain('border-radius:999px');
    expect(html).toContain('>RSVP</a>');
    expect(html).toContain('Quick one. ');
    expect(plainText).toContain('RSVP: https://h.test/r?t=abc&action=going');
  });

  it('FAIL-LOUD: missing body_token_urls renders the literal {{token}} as the href', () => {
    const section = { kind: 'stats_narrative', body: 'See {{token:schedule_url}}' };
    const { html, plainText } = render(section);
    expect(html).toContain('href="{{token:schedule_url}}"');
    expect(html).toContain('>Schedule</a>');
    expect(plainText).toContain('Schedule: {{token:schedule_url}}');
  });

  it('FAIL-LOUD: body_token_urls present but missing THIS kind falls back to literal', () => {
    const section = {
      kind: 'stats_narrative',
      body: '{{token:directions_url}}',
      body_token_urls: { schedule: 'https://a.test/s/1' },
    };
    const { html } = render(section);
    expect(html).toContain('href="{{token:directions_url}}"');
  });

  it('directions + schedule tokens both render with their labels', () => {
    const section = {
      kind: 'stats_narrative',
      body: '{{token:directions_url}} and {{token:schedule_url}}',
      body_token_urls: { directions: 'https://maps.test/d', schedule: 'https://a.test/s/1' },
    };
    const { html } = render(section);
    expect(html).toContain('href="https://maps.test/d"');
    expect(html).toContain('>Directions</a>');
    expect(html).toContain('href="https://a.test/s/1"');
    expect(html).toContain('>Schedule</a>');
  });
});
