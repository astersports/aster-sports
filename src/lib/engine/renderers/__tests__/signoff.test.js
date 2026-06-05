import { describe, expect, it } from 'vitest';
import render from '../signoff';
import fixture from '../../__fixtures__/signoff';

describe('free-text F2 — signoff', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('renders prose paragraph + HR + each coach row', () => {
    const { html } = render(fixture);
    expect(html).toContain('See you Saturday');
    expect(html).toMatch(/<hr/);
    expect(html).toContain('Frank Samaritano');
    expect(html).toContain('Program Director · 914-555-1234');
    expect(html).toContain('Kenny Lane');
  });
  it('omits HR when no coaches', () => {
    const out = render({ kind: 'signoff', prose: 'Hello.', coaches: [] });
    expect(out.html).not.toMatch(/<hr/);
    expect(out.html).toContain('Hello.');
  });
  it('plainText concatenates prose + coach lines', () => {
    const { plainText } = render(fixture);
    expect(plainText).toContain('See you Saturday. Bring it.');
    expect(plainText).toContain('Frank Samaritano');
    expect(plainText).toContain('Program Director · 914-555-1234');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });

  // Team-aware voice signature (architect C3): the narrative signs in voice.
  it('renders the voice signature line above the contact block', () => {
    const { html, plainText } = render({ kind: 'signoff', prose: 'Hello.', signature: 'Frank & Coach Kenny', coaches: [] });
    expect(html).toContain('&#8212; Frank &amp; Coach Kenny');
    // signature precedes the prose paragraph
    expect(html.indexOf('Frank &amp; Coach Kenny')).toBeLessThan(html.indexOf('Hello.'));
    expect(plainText).toContain('— Frank & Coach Kenny');
  });
  it('omits the signature line when absent (back-compat)', () => {
    const { html, plainText } = render({ kind: 'signoff', prose: 'Hi.', coaches: [] });
    expect(html).not.toContain('&#8212;');
    expect(plainText).not.toMatch(/^—/m);
  });
});
