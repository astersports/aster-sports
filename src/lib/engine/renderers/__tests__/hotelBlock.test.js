import { describe, expect, it } from 'vitest';
import render from '../hotelBlock';
import fixture from '../../__fixtures__/hotelBlock';

describe('template T1 — hotelBlock', () => {
  it('returns { html, plainText }', () => {
    const out = render(fixture);
    expect(out).toEqual(expect.objectContaining({ html: expect.any(String), plainText: expect.any(String) }));
  });
  it('uses red urgency styling', () => {
    const { html } = render(fixture);
    expect(html).toContain('background-color:#fef2f2');
    expect(html).toContain('border-left:4px solid #dc2626');
    expect(html).toContain('color:#dc2626');
  });
  it('eyebrow says days remaining', () => {
    const { html } = render(fixture);
    expect(html).toContain('HOTEL BLOCK CLOSES IN 3 DAYS');
  });
  it('says "TODAY" when 0 days remain', () => {
    const out = render({ ...fixture, days_remaining: 0 });
    expect(out.html).toContain('HOTEL BLOCK CLOSES TODAY');
  });
  it('singular DAY when 1 day remains', () => {
    const out = render({ ...fixture, days_remaining: 1 });
    expect(out.html).toContain('HOTEL BLOCK CLOSES IN 1 DAY');
  });
  it('plainText includes deadline + hotel info', () => {
    const { plainText } = render(fixture);
    expect(plainText).toContain('Hampton Inn');
    expect(plainText).toContain('Deadline:');
  });
  it('matches snapshot', () => {
    expect(render(fixture)).toMatchSnapshot();
  });

  // ENGINE-1: the prelim override path emits { text } with no days_remaining.
  // Previously days defaulted to 0 → false "CLOSES TODAY" + dropped body.
  it('renders a text-only override as body, no false "CLOSES TODAY"', () => {
    const { html, plainText } = render({ text: 'Hampton Inn, block code LH26' });
    expect(html).toContain('Hampton Inn, block code LH26');
    expect(html).toContain('HOTEL BLOCK');
    expect(html).not.toContain('CLOSES TODAY');
    expect(plainText).toContain('Hampton Inn');
    expect(plainText).not.toContain('CLOSES TODAY');
  });

  it('still shows the countdown when days_remaining is present', () => {
    expect(render({ hotel_info: 'X', days_remaining: 0 }).html).toContain('CLOSES TODAY');
    expect(render({ hotel_info: 'X', days_remaining: 2 }).html).toContain('CLOSES IN 2 DAYS');
  });
});
