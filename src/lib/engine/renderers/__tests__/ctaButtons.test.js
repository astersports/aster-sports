import { describe, expect, it } from 'vitest';
import render from '../ctaButtons';
import fixture from '../../__fixtures__/ctaButtons';

describe('template T6 — ctaButtons', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('renders <a> elements (email-safe), not <button>', () => {
    const { html } = render(fixture);
    expect(html).toMatch(/<a\s+href=/);
    expect(html).not.toContain('<button');
  });
  it('cobalt fill + uppercase text', () => {
    const { html } = render(fixture);
    expect(html).toContain('background-color:#151525');
    expect(html).toContain('color:#ffffff');
    expect(html).toContain('TRACK LIVE STANDINGS');
    expect(html).toContain('VIEW BRACKET');
  });
  it('caps at 2 buttons even if more passed', () => {
    const out = render({ kind: 'cta_buttons', buttons: [
      { text: 'A', url: 'a' }, { text: 'B', url: 'b' }, { text: 'C', url: 'c' },
    ] });
    expect(out.html).toContain('>A</a>');
    expect(out.html).toContain('>B</a>');
    expect(out.html).not.toContain('>C</a>');
  });
  it('plainText pairs label + url', () => {
    const { plainText } = render(fixture);
    expect(plainText).toContain('TRACK LIVE STANDINGS: https://example.com/standings');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
