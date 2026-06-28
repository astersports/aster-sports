import { describe, expect, it } from 'vitest';
import { renderFooter } from '../footer';

describe('renderer — footer (Wave 3.6 §D4)', () => {
  const fixture = {
    kind: 'footer',
    logoUrl: 'https://astersports.app/aster-mark-240.png',
    orgName: 'Aster AAU',
    websiteUrl: 'https://www.legacyhoopers.org/',
    contactEmail: 'info@legacyhoopers.org',
  };

  it('returns { html, plainText }', () => {
    const out = renderFooter(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });

  it('renders 120x120 logo image with alt text', () => {
    const { html } = renderFooter(fixture);
    expect(html).toContain('src="https://astersports.app/aster-mark-240.png"');
    expect(html).toContain('width="120"');
    expect(html).toContain('height="120"');
    expect(html).toContain('alt="Aster AAU"');
  });

  it('uses the org brand logo (post-auth Aster mark), NOT Phoenix apple-touch-icon (PWA shell)', () => {
    const { html } = renderFooter(fixture);
    expect(html).toContain('aster-mark');
    expect(html).not.toContain('apple-touch-icon');
    expect(html).not.toContain('phoenix');
  });

  it('renders website link with bare-host display + target=_blank rel=noopener', () => {
    const { html } = renderFooter(fixture);
    expect(html).toContain('href="https://www.legacyhoopers.org/"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
    expect(html).toMatch(/>legacyhoopers\.org<\/a>/);
  });

  it('renders mailto link for contact email', () => {
    const { html } = renderFooter(fixture);
    expect(html).toContain('href="mailto:info@legacyhoopers.org"');
    expect(html).toMatch(/>info@legacyhoopers\.org<\/a>/);
  });

  it('uses BG_PAGE background for visual distinction', () => {
    const { html } = renderFooter(fixture);
    expect(html).toContain('background-color:#f8fafc');
  });

  it('plainText concatenates org name + host + contact', () => {
    const { plainText } = renderFooter(fixture);
    expect(plainText).toContain('Aster AAU');
    expect(plainText).toContain('legacyhoopers.org');
    expect(plainText).toContain('Contact: info@legacyhoopers.org');
  });

  it('omits each element when prop is missing', () => {
    expect(renderFooter({ orgName: 'Org' }).html).not.toContain('<img');
    expect(renderFooter({ logoUrl: 'x' }).html).not.toContain('<a href="https://');
    expect(renderFooter({}).html).not.toContain('mailto:');
  });

  // Wave 4.1 §7 — CAN-SPAM unsubscribe block.
  it('always emits {{UNSUBSCRIBE_URL}} placeholder for send-time substitution', () => {
    expect(renderFooter(fixture).html).toContain('{{UNSUBSCRIBE_URL}}');
    expect(renderFooter({}).html).toContain('{{UNSUBSCRIBE_URL}}');
  });

  it('uses player + team context line when both are provided', () => {
    const { html } = renderFooter({ ...fixture, playerName: 'Sara K', teamName: '10U Blue' });
    expect(html).toContain('because Sara K is on the 10U Blue roster');
    expect(html).toContain('at Aster AAU');
  });

  it('falls back to generic context line when player/team are missing', () => {
    const { html } = renderFooter(fixture);
    expect(html).toContain('You are receiving this as a member of Aster AAU');
  });

  it('plainText surfaces unsubscribe placeholder for plain-text fallback', () => {
    expect(renderFooter(fixture).plainText).toContain('Unsubscribe: {{UNSUBSCRIBE_URL}}');
  });
});
