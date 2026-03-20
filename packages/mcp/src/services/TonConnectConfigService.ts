/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { join } from 'node:path';

import { createDeviceInfo, createWalletManifest } from '@ton/walletkit';

import { getConfigDir } from '../registry/config.js';
import type { TonConnectResolvedConfig } from '../types/tonconnect.js';

const DEFAULT_BRIDGE_URL = 'https://connect.ton.org/bridge';
const DEFAULT_STORAGE_FILE = 'tonconnect-storage.json';
const DEFAULT_APP_NAME = 'TON MCP';
const DEFAULT_ABOUT_URL = 'https://github.com/ton-connect/kit/tree/main/packages/mcp';

export function resolveTonConnectConfig(runtimeKey: string): TonConnectResolvedConfig {
    const platform =
        process.platform === 'win32'
            ? { device: 'windows' as const, manifest: 'windows' as const }
            : process.platform === 'darwin'
              ? { device: 'mac' as const, manifest: 'macos' as const }
              : { device: 'linux' as const, manifest: 'linux' as const };
    const storagePath =
        process.env.TONCONNECT_STORAGE_PATH?.trim() || join(getConfigDir(), DEFAULT_STORAGE_FILE);
    const bridgeUrl = process.env.TONCONNECT_BRIDGE_URL?.trim() || DEFAULT_BRIDGE_URL;
    const appName = process.env.TONCONNECT_APP_NAME?.trim() || DEFAULT_APP_NAME;
    const manifestName = process.env.TONCONNECT_MANIFEST_NAME?.trim() || appName;
    const imageUrl = process.env.TONCONNECT_MANIFEST_IMAGE_URL?.trim();
    const aboutUrl = process.env.TONCONNECT_MANIFEST_ABOUT_URL?.trim() || DEFAULT_ABOUT_URL;
    const universalLink = process.env.TONCONNECT_UNIVERSAL_LINK?.trim();
    const manifestRequested = Boolean(
        imageUrl || universalLink || process.env.TONCONNECT_MANIFEST_NAME || process.env.TONCONNECT_MANIFEST_ABOUT_URL,
    );

    return {
        storagePath,
        storagePrefix: `ton-mcp:tonconnect:${runtimeKey.replace(/[^a-zA-Z0-9:_-]/g, '_')}:`,
        bridgeUrl,
        ...(manifestRequested
            ? {
                  walletManifest: createWalletManifest({
                      name: manifestName,
                      appName,
                      imageUrl: imageUrl || `${DEFAULT_ABOUT_URL}/raw/main/.github/assets/tonconnect.png`,
                      aboutUrl,
                      universalLink: universalLink || aboutUrl,
                      bridgeUrl,
                      platforms: [platform.manifest],
                  }),
              }
            : {}),
        deviceInfo: createDeviceInfo({
            appName,
            appVersion: process.env.npm_package_version?.trim() || '0.1.0',
            maxProtocolVersion: 2,
            platform: platform.device,
            features: [
                {
                    name: 'SendTransaction',
                    maxMessages: 255,
                },
                {
                    name: 'SignData',
                    types: ['binary', 'cell', 'text'],
                },
            ],
        }),
    };
}
