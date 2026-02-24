/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';
import type { Address as OmnistonAddress } from '@ston-fi/omniston-sdk';

import { Network } from '../../../api/models';
import type { OmnistonQuoteMetadata } from './types';
import type { SwapToken } from '../../../api/models';

export const tokenToAddress = (token: SwapToken): string => {
    if (token.address === 'ton') {
        return 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    }
    return Address.parse(token.address).toRawString();
};

export const addressToToken = (address: string, decimals: number = 9): SwapToken => {
    if (address === 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c') {
        return { address: 'ton', decimals: 9 };
    }

    try {
        return { address: Address.parseRaw(address).toString(), decimals };
    } catch {
        return { address, decimals };
    }
};

export const toOmnistonAddress = (address: string, network: Network): OmnistonAddress => {
    return {
        address,
        blockchain: mapNetworkToBlockchainId(network),
    };
};

export const mapNetworkToBlockchainId = (network: Network): number => {
    switch (network.chainId) {
        case Network.mainnet().chainId: {
            return 607;
        }

        default: {
            throw new Error(`Unsupported network: ${network.chainId}`);
        }
    }
};

export const isOmnistonQuoteMetadata = (metadata: unknown): metadata is OmnistonQuoteMetadata => {
    if (!metadata || typeof metadata !== 'object') {
        return false;
    }

    const meta = metadata as Record<string, unknown>;

    return (
        typeof meta.quoteId === 'string' &&
        typeof meta.resolverId === 'string' &&
        typeof meta.omnistonQuote === 'object' &&
        meta.omnistonQuote !== null
    );
};
