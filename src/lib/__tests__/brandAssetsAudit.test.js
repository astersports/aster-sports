// Brand-asset audit (static, AP #43-shaped invariant):
// every icon/social asset referenced by the install + share surfaces
// (public/manifest.webmanifest, index.html) must exist as a file in
// public/, the manifest must keep the full PWA icon set (192/512 in
// both any + maskable purposes), and the public/brand/ variants must
// stay flat-color (no gradient url() refs — they exist precisely to be
// the non-gradient kit). Guards against icon renames/deletions silently
// breaking install UX or link previews.
/* global process */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUB = join(process.cwd(), 'public');
const manifest = JSON.parse(
  readFileSync(join(PUB, 'manifest.webmanifest'), 'utf8')
);

describe('brand assets audit', () => {
  it('every manifest icon src resolves to a file in public/', () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith('/'), `${icon.src} must be root-relative`).toBe(true);
      expect(existsSync(join(PUB, icon.src)), `missing public${icon.src}`).toBe(true);
    }
  });

  it('manifest ships 192/512 PNG pairs for both any and maskable purposes', () => {
    const sizesFor = (purpose) =>
      manifest.icons
        .filter((i) => (i.purpose || 'any') === purpose && i.type === 'image/png')
        .map((i) => i.sizes);
    expect(sizesFor('any')).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(sizesFor('maskable')).toEqual(expect.arrayContaining(['192x192', '512x512']));
  });

  it('index.html icon/manifest links and og:image resolve to files in public/', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const hrefs = [
      ...html.matchAll(/<link[^>]+rel="(?:icon|apple-touch-icon|manifest)"[^>]+href="([^"]+)"/g),
    ].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    for (const href of hrefs) {
      expect(existsSync(join(PUB, href)), `missing public${href}`).toBe(true);
    }
    const og = html.match(/property="og:image" content="https:\/\/astersports\.app(\/[^"]+)"/);
    expect(og, 'og:image must be an absolute astersports.app URL').toBeTruthy();
    expect(existsSync(join(PUB, og[1])), `missing public${og[1]}`).toBe(true);
  });

  it('brand variants exist and are flat-color (no gradient refs)', () => {
    for (const variant of ['gold', 'white', 'black']) {
      const path = join(PUB, 'brand', `aster-mark-${variant}.svg`);
      expect(existsSync(path), `missing brand/aster-mark-${variant}.svg`).toBe(true);
      expect(readFileSync(path, 'utf8')).not.toMatch(/url\(#/);
    }
  });
});
