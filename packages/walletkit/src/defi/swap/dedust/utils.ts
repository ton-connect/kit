/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import { Network } from '../../../api/models';
import type { DeDustQuoteMetadata } from './models';
import type { SwapToken } from '../../../api/models';

/**
 * Native TON identifier used by DeDust Router API
 */
export const NATIVE_TON_MINTER = 'native';

/**
 * Convert SwapToken to DeDust minter address string
 * DeDust API expects user-friendly address format (e.g., EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE)
 */
export const tokenToMinter = (token: SwapToken): string => {
    if (token.address === 'ton') {
        return NATIVE_TON_MINTER;
    }
    // Return user-friendly address format (base64 with workchain prefix)
    return Address.parse(token.address).toString({ bounceable: true, urlSafe: true });
};

/**
 * Convert DeDust minter address string to SwapToken
 */
export const minterToToken = (minter: string, decimals: number = 9): SwapToken => {
    if (minter === NATIVE_TON_MINTER) {
        return { address: 'ton', decimals: 9 };
    }

    try {
        return { address: Address.parseRaw(minter).toString(), decimals };
    } catch {
        return { address: minter, decimals };
    }
};

/**
 * Check if token is native TON
 */
export const isNativeTon = (token: SwapToken): boolean => {
    return token.address === 'ton';
};

/**
 * Validate network is supported (mainnet only for DeDust)
 */
export const validateNetwork = (network: Network): void => {
    if (network.chainId !== Network.mainnet().chainId) {
        throw new Error(`DeDust only supports mainnet. Got chainId: ${network.chainId}`);
    }
};

/**
 * Type guard for DeDustQuoteMetadata
 */
export const isDeDustQuoteMetadata = (metadata: unknown): metadata is DeDustQuoteMetadata => {
    if (!metadata || typeof metadata !== 'object') {
        return false;
    }

    const meta = metadata as Record<string, unknown>;

    return typeof meta.quoteResponse === 'object' && meta.quoteResponse !== null;
};
