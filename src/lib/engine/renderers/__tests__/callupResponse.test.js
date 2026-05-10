// Wave 4.2-A-8c — callup_response atomic renderer unit tests.

import { describe, expect, it } from 'vitest';
import render from '../callupResponse';

const post = {
  kind: 'callup_response',
  player_id: 'p-1',
  window_label: 'Please respond by 12:00 PM today.',
  deadline_at: '2026-05-11T16:00:00Z',
  callup_token_urls: {
    accept: 'https://x.test/?p=p-1&a=accept',
    decline: 'https://x.test/?p=p-1&a=decline',
  },
};

describe('callup_response renderer', () => {
  it('1. renders both buttons with substituted URLs', () => {
    const { html } = render(post);
    expect(html).toContain('https://x.test/?p=p-1&amp;a=accept');
    expect(html).toContain('https://x.test/?p=p-1&amp;a=decline');
    expect(html).toContain('ACCEPT CALL-UP');
    expect(html).toContain('DECLINE');
  });

  it('2. renders window_label when provided; omits when absent', () => {
    const withLabel = render(post);
    expect(withLabel.html).toContain('Please respond by 12:00 PM today.');
    const withoutLabel = render({ ...post, window_label: '' });
    expect(withoutLabel.html).not.toContain('Please respond');
  });

  it('3. renders heading', () => {
    const { html } = render(post);
    expect(html).toContain('Respond to this call-up');
  });

  it('4. fail-loud fallback: callup_token_urls absent -> hrefs render literal {{callup_*_url}}', () => {
    const pre = { ...post, callup_token_urls: undefined, callup_token_placeholders: { accept: '{{callup_accept_url}}', decline: '{{callup_decline_url}}' } };
    const { html, plainText } = render(pre);
    expect(html).toContain('{{callup_accept_url}}');
    expect(html).toContain('{{callup_decline_url}}');
    expect(plainText).toContain('Accept: {{callup_accept_url}}');
  });
});
