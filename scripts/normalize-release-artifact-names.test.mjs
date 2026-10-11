import { mkdtempSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
  hyphenatedArtifactName,
  normalizeReleaseArtifactNames,
} from './normalize-release-artifact-names.mjs';
import { PRODUCT_FILE_NAME, PRODUCT_NAME, WIN_PER_USER_INSTALL_DIR_NAME } from './productNames.mjs';

const tempDirs = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('productNames', () => {
  it('derives the hyphenated file name from package.json productName', () => {
    expect(PRODUCT_NAME).toBe('Mesh Hub');
    expect(PRODUCT_FILE_NAME).toBe('Mesh-Hub');
    expect(WIN_PER_USER_INSTALL_DIR_NAME).toBe('mesh-hub');
  });
});

describe('hyphenatedArtifactName', () => {
  it.each([
    ['Mesh Hub-1.0.0.dmg', 'Mesh-Hub-1.0.0.dmg'],
    ['Mesh Hub-1.0.0-arm64.dmg', 'Mesh-Hub-1.0.0-arm64.dmg'],
    ['Mesh Hub-1.0.0-mac.zip', 'Mesh-Hub-1.0.0-mac.zip'],
    ['Mesh Hub-1.0.0-arm64-mac.zip.blockmap', 'Mesh-Hub-1.0.0-arm64-mac.zip.blockmap'],
    ['Mesh Hub-1.0.0.AppImage', 'Mesh-Hub-1.0.0.AppImage'],
  ])('hyphenates %s', (from, to) => {
    expect(hyphenatedArtifactName(from)).toBe(to);
  });

  it.each([
    'Mesh-Hub-1.0.0.dmg',
    'mesh-hub_1.0.0_amd64.deb',
    'latest-mac.yml',
    'Other App 1.0.dmg',
  ])('leaves %s alone', (name) => {
    expect(hyphenatedArtifactName(name)).toBeNull();
  });
});

describe('normalizeReleaseArtifactNames', () => {
  it('renames spaced product files and skips directories', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'mesh-normalize-artifacts-'));
    tempDirs.push(dir);
    writeFileSync(path.join(dir, 'Mesh Hub-1.0.0.dmg'), '');
    writeFileSync(path.join(dir, 'latest-mac.yml'), '');
    mkdirSync(path.join(dir, 'Mesh Hub-unpacked dir'));

    const { renamed } = normalizeReleaseArtifactNames(dir);

    expect(renamed.map((r) => path.basename(r.to))).toEqual(['Mesh-Hub-1.0.0.dmg']);
    expect(readdirSync(dir).sort()).toEqual(
      ['Mesh Hub-unpacked dir', 'Mesh-Hub-1.0.0.dmg', 'latest-mac.yml'].sort(),
    );
  });

  it('refuses to overwrite an existing hyphenated file', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'mesh-normalize-artifacts-'));
    tempDirs.push(dir);
    writeFileSync(path.join(dir, 'Mesh Hub-1.0.0.dmg'), 'a');
    writeFileSync(path.join(dir, 'Mesh-Hub-1.0.0.dmg'), 'b');
    expect(() => normalizeReleaseArtifactNames(dir)).toThrow(/Refusing to overwrite/);
  });
});
