/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TonChainEnum } from '../types';

/**
 * Normalizes user-provided network values into TonWalletKit chain identifiers.
 */
export function normalizeNetworkValue(value: string | number | null | undefined, chain: TonChainEnum): number {
    const mainnet = chain.MAINNET;
    const testnet = chain.TESTNET;

    if (value == null) {
        return testnet;
    }
    if (value === mainnet || value === testnet) {
        return value as number;
    }
    if (typeof value === 'string') {
        const lowered = value.toLowerCase();
        if (lowered === 'mainnet') {
            return mainnet;
        }
        if (lowered === 'testnet') {
            return testnet;
        }
    }
    return testnet;
}
