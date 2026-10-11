#!/usr/bin/env node
/**
 * Hyphenate spaced release artifact basenames (dmg, zip, AppImage, blockmaps, …) so disk
 * names match the `safeArtifactName` URLs electron-builder writes into latest*.yml and
 * survive GitHub's space-to-dot rewrite on upload. Windows NSIS installers have their own
 * step (normalize-win-setup-artifact-names.mjs); this covers every other product artifact.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { PRODUCT_NAME } from './productNames.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {string} name basename
 * @returns {string | null} hyphenated name, or null when the file should be left alone
 */
export function hyphenatedArtifactName(name) {
  if (typeof name !== 'string' || !name.includes(' ')) return null;
  if (!name.startsWith(`${PRODUCT_NAME}-`) && !name.startsWith(`${PRODUCT_NAME} `)) return null;
  if (name.includes('__uninstaller')) return null;
  return name.replace(/ /g, '-');
}

/**
 * Rename top-level spaced product artifacts in rootDir.
 *
 * @param {string} rootDir
 * @param {{ names?: string[], renameFile?: (from: string, to: string) => void, isFile?: (p: string) => boolean }} [opts]
 * @returns {{ renamed: Array<{ from: string, to: string }> }}
 */
export function normalizeReleaseArtifactNames(rootDir, opts = {}) {
  const names = opts.names ?? fs.readdirSync(rootDir);
  const renameFile = opts.renameFile ?? ((from, to) => fs.renameSync(from, to));
  const isFile = opts.isFile ?? ((p) => fs.statSync(p).isFile());
  /** @type {Array<{ from: string, to: string }>} */
  const renamed = [];
  for (const name of names) {
    const next = hyphenatedArtifactName(name);
    if (!next) continue;
    const from = path.join(rootDir, name);
    if (!isFile(from)) continue;
    const to = path.join(rootDir, next);
    if (names.includes(next) || fs.existsSync(to)) {
      throw new Error(`Refusing to overwrite existing file: ${to}`);
    }
    renameFile(from, to);
    renamed.push({ from, to });
  }
  return { renamed };
}

function main() {
  let rootDir = path.join(ROOT, 'release');
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root' && argv[i + 1]) rootDir = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (!fs.existsSync(rootDir)) {
    console.debug(`[normalize-release-artifact-names] ${rootDir} missing; nothing to do`);
    return;
  }
  const { renamed } = normalizeReleaseArtifactNames(rootDir);
  console.debug(`[normalize-release-artifact-names] renamed ${renamed.length} file(s)`);
  for (const row of renamed) {
    console.debug(`  ${path.basename(row.from)} → ${path.basename(row.to)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
