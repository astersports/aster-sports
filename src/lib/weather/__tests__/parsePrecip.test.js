import { describe, expect, it } from 'vitest';
import { parsePrecip } from '../parsePrecip';

describe('parsePrecip', () => {
  it('parses rain', () => expect(parsePrecip('55% rain')).toEqual({ pct: 55, kind: 'rain' }));
  it('parses snow', () => expect(parsePrecip('80% snow')).toEqual({ pct: 80, kind: 'snow' }));
  it('parses storms', () => expect(parsePrecip('96% storms')).toEqual({ pct: 96, kind: 'storms' }));
  it('returns nulls for empty / missing input', () => {
    expect(parsePrecip(null)).toEqual({ pct: null, kind: null });
    expect(parsePrecip(undefined)).toEqual({ pct: null, kind: null });
    expect(parsePrecip('')).toEqual({ pct: null, kind: null });
  });
  it('returns nulls for an unparseable string', () => {
    expect(parsePrecip('TBD')).toEqual({ pct: null, kind: null });
  });
});
