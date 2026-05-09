import { describe, expect, it } from 'vitest';
import render from '../opsNotes';
import fixture from '../../__fixtures__/opsNotes';

describe('template T5 — opsNotes', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('navy eyebrow + cobalt bullets', () => {
    const { html } = render(fixture);
    expect(html).toContain('BEFORE YOU GO');
    expect(html).toContain('color:#0f172a'); // navy eyebrow
    expect(html).toContain('background-color:#4a8fd4'); // cobalt bullet dot
  });
  it('default title is NOTES when omitted', () => {
    const out = render({ kind: 'ops_notes', items: ['One', 'Two'] });
    expect(out.html).toContain('NOTES');
  });
  it('plainText echoes title + bulleted items', () => {
    const { plainText } = render(fixture);
    expect(plainText).toContain('BEFORE YOU GO');
    expect(plainText).toContain('• Arrive 30 minutes early');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });
});
