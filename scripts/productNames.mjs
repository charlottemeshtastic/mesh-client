import { readFileSync } from 'node:fs';

/**
 * Packaged product names, derived from package.json `productName` (e.g. "Mesh Hub").
 *
 * - PRODUCT_NAME: the display name; electron-builder uses it for `Mesh Hub.app`,
 *   `Mesh Hub.exe`, and default artifact names (which therefore contain spaces).
 * - PRODUCT_FILE_NAME: the hyphenated form electron-builder writes into latest*.yml
 *   (`safeArtifactName`), which release artifacts are renamed to on disk so the
 *   names survive GitHub's space-to-dot rewrite on upload.
 */
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

export const PRODUCT_NAME = String(pkg.productName);
export const PRODUCT_FILE_NAME = PRODUCT_NAME.replace(/ /g, '-');
/** GitHub's rewrite of PRODUCT_NAME in uploaded asset names (spaces become dots). */
export const PRODUCT_GITHUB_NAME = PRODUCT_NAME.replace(/ /g, '.');
