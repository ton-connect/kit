/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ITonConnect } from '@tonconnect/sdk';
import type { ApiClient, NetworkAdapters } from '@ton/walletkit';

/**
 * Configuration for AppKit
 *
 * @example
 * ```ts
 * import { CreateAppKit } from '@ton/appkit';
 * import { Network } from '@ton/walletkit';
 *
 * const appKit = CreateAppKit({
 *     networks: {
 *         [Network.mainnet().chainId]: {
 *             apiClient: {
 *                 key: process.env.APP_TONCENTER_KEY,
 *                 url: 'https://toncenter.com',
 *             },
 *         },
 *         // Optionally configure testnet as well
 *         // [Network.testnet().chainId]: {
 *         //     apiClient: {
 *         //         key: process.env.APP_TONCENTER_KEY_TESTNET,
 *         //         url: 'https://testnet.toncenter.com',
 *         //     },
 *         // },
 *     },
 * });
 * ```
 */
export interface AppKitConfig {
    /**
     * Network configuration
     * At least one network must be configured.
     *
     * Keys are chain IDs (use `Network.mainnet().chainId` or `Network.testnet().chainId`)
     * Values contain apiClient configuration (url and optional API key)
     */
    networks?: NetworkAdapters;
}

/**
 * Dependencies required by AppKit (extracted from config for internal use)
 */
export interface AppKitDependencies {
    tonConnect: ITonConnect;
    client: ApiClient;
}
