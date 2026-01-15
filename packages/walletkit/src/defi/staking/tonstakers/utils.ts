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

export const tokenToAddress = (token: string): string => {
    if (token === 'TON') {
        return 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    }
    return Address.parse(token).toRawString();
};

export const addressToToken = (address: string): string => {
    if (address === 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c') {
        return 'TON';
    }
    try {
        return Address.parseRaw(address).toString();
    } catch {
        return address;
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
        meta.omnistonQuote !== null &&
        typeof meta.network === 'object' &&
        meta.network !== null
    );
};
