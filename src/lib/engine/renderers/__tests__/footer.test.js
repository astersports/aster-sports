import { describe, expect, it } from 'vitest';
import { renderFooter } from '../footer';

describe('renderer — footer (Wave 3.6 §D4)', () => {
  const fixture = {
    kind: 'footer',
    logoUrl: 'https://skyfire-app.vercel.app/apple-touch-icon.png',
    orgName: 'Legacy Hoopers',
    websiteUrl: 'https://www.legacyhoopers.org/',
    contactEmail: 'info@legacyhoopers.org',
  };

  it('returns { html, plainText }', () => {
    const out = renderFooter(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });

  it('renders 120x120 logo image with alt text', () => {
    const { html } = renderFooter(fixture);
    expect(html).toContain('src="https://skyfire-app.vercel.app/apple-touch-icon.png"');
    expect(html).toContain('width="120"');
    expect(html).toContain('height="120"');
    expect(html).toContain('alt="Legacy Hoopers"');
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
    expect(plainText).toContain('Legacy Hoopers');
    expect(plainText).toContain('legacyhoopers.org');
    expect(plainText).toContain('Contact: info@legacyhoopers.org');
  });

  it('omits each element when prop is missing', () => {
    expect(renderFooter({ orgName: 'Org' }).html).not.toContain('<img');
    expect(renderFooter({ logoUrl: 'x' }).html).not.toContain('<a href="https://');
    expect(renderFooter({}).html).not.toContain('mailto:');
  });
});
