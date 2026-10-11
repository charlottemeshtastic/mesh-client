import { describe, expect, it } from 'vitest';

import {
  assertAllChannelYmlUrlsAreReleaseAssets,
  assertYmlUrlsAreReleaseAssets,
  collectReleaseAssetNames,
} from './assert-github-release-update-yml.mjs';

const WIN_YML = `version: 5.36.0
files:
  - url: Mesh-Hub-Setup-5.36.0.exe
  - url: Mesh-Hub-Setup-5.36.0-arm64.exe
path: Mesh-Hub-Setup-5.36.0.exe
`;

const MAC_YML = `files:
  - url: Mesh-Hub-5.36.0-mac.zip
path: Mesh-Hub-5.36.0-mac.zip
`;

const LINUX_YML = `files:
  - url: Mesh-Hub-5.36.0.AppImage
path: Mesh-Hub-5.36.0.AppImage
`;

const LINUX_ARM_YML = `files:
  - url: Mesh-Hub-5.36.0-arm64.AppImage
path: Mesh-Hub-5.36.0-arm64.AppImage
`;

describe('collectReleaseAssetNames', () => {
  it('keeps string names only', () => {
    expect(
      collectReleaseAssetNames([{ name: 'latest.yml' }, { name: 1 }, { name: 'a.exe' }]),
    ).toEqual(['latest.yml', 'a.exe']);
  });
});

describe('assertYmlUrlsAreReleaseAssets', () => {
  it('passes when every url is an asset name', () => {
    expect(
      assertYmlUrlsAreReleaseAssets('latest.yml', WIN_YML, [
        'latest.yml',
        'Mesh-Hub-Setup-5.36.0.exe',
        'Mesh-Hub-Setup-5.36.0-arm64.exe',
      ]),
    ).toEqual({
      yml: 'latest.yml',
      urls: ['Mesh-Hub-Setup-5.36.0.exe', 'Mesh-Hub-Setup-5.36.0-arm64.exe'],
    });
  });

  it('fails on the v5.36.0 hyphenated-vs-dotted mismatch', () => {
    expect(() =>
      assertYmlUrlsAreReleaseAssets('latest.yml', WIN_YML, [
        'latest.yml',
        'Mesh.Hub.Setup.5.36.0.exe',
        'Mesh.Hub.Setup.5.36.0-arm64.exe',
      ]),
    ).toThrow(/urls not present as release assets/);
  });
});

describe('assertAllChannelYmlUrlsAreReleaseAssets', () => {
  it('checks win/mac/linux channel files against one asset list', () => {
    const result = assertAllChannelYmlUrlsAreReleaseAssets(
      {
        'latest.yml': WIN_YML,
        'latest-mac.yml': MAC_YML,
        'latest-linux.yml': LINUX_YML,
        'latest-linux-arm64.yml': LINUX_ARM_YML,
      },
      [
        'latest.yml',
        'latest-mac.yml',
        'latest-linux.yml',
        'latest-linux-arm64.yml',
        'Mesh-Hub-Setup-5.36.0.exe',
        'Mesh-Hub-Setup-5.36.0-arm64.exe',
        'Mesh-Hub-5.36.0-mac.zip',
        'Mesh-Hub-5.36.0.AppImage',
        'Mesh-Hub-5.36.0-arm64.AppImage',
      ],
    );
    expect(result.checked).toEqual([
      'latest.yml',
      'latest-mac.yml',
      'latest-linux.yml',
      'latest-linux-arm64.yml',
    ]);
  });

  it('fails when no channel yml assets were uploaded', () => {
    expect(() => assertAllChannelYmlUrlsAreReleaseAssets({}, ['a.exe'])).toThrow(
      /No update channel yml assets/,
    );
  });
});
