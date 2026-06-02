// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { publicScheduleUrl } from '../publicUrls';

describe('publicScheduleUrl', () => {
  it('builds the public schedule URL from an explicit origin', () => {
    expect(publicScheduleUrl('t1', 'https://astersports.app'))
      .toBe('https://astersports.app/schedule/t1');
  });

  it('falls back to window.location.origin when origin is omitted', () => {
    expect(publicScheduleUrl('abc')).toBe(`${window.location.origin}/schedule/abc`);
  });
});
