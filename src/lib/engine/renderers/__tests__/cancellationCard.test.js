// PR-D — cancellation_card renderer tests. Warn tone (NOT red), Cancelled
// label, title, struck old time, reason, no action buttons.

import { describe, expect, it } from 'vitest';
import render from '../cancellationCard';
import { RSVP_OUT_RED, WARN, WARN_WASH } from '../../colors';

const fixture = {
  kind: 'cancellation_card',
  title: '8U Boys · Practice',
  old_time: 'Tomorrow · 5:30 PM',
  reason: 'Sportsplex double-booked. Back to normal Thursday.',
};

describe('cancellationCard', () => {
  it('returns { html, plainText }', () => {
    expect(render(fixture)).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });

  it('uses WARN tone, NOT the destructive red', () => {
    const { html } = render(fixture);
    expect(html).toContain(WARN);
    expect(html).toContain(WARN_WASH);
    expect(html).not.toContain(RSVP_OUT_RED);
  });

  it('renders the Cancelled label, title, and reason', () => {
    const { html } = render(fixture);
    expect(html).toContain('Cancelled');
    expect(html).toContain('8U Boys · Practice');
    expect(html).toContain('Sportsplex double-booked. Back to normal Thursday.');
  });

  it('strikes through the OLD time', () => {
    const { html } = render(fixture);
    expect(html).toMatch(/text-decoration:line-through;">Tomorrow · 5:30 PM<\/span>/);
  });

  it('has NO action buttons (render only)', () => {
    const { html } = render(fixture);
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('<button');
  });

  it('plainText leads with CANCELLED and includes the reason', () => {
    const { plainText } = render(fixture);
    expect(plainText.startsWith('CANCELLED')).toBe(true);
    expect(plainText).toContain('Was: Tomorrow · 5:30 PM');
    expect(plainText).toContain('Sportsplex double-booked');
  });

  it('escapes HTML in the reason', () => {
    const { html } = render({ ...fixture, reason: '<script>x</script>' });
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
