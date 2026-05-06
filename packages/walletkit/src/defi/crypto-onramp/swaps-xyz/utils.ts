/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampStatus } from '../../../api/models';
import { parseCaip2 } from '../caip2';
import type { SwapsXyzErrorResponse } from './types';

const EVM_ADDRESS_REGEX = /^(0x)?[0-9a-fA-F]{40}$/;

/**
 * Extract a numeric EVM chain id from a CAIP-2 string. Returns `undefined`
 * for non-EVM (`namespace !== 'eip155'`) or malformed values.
 */
export const parseEvmChainIdFromCaip2 = (value: string): number | undefined => {
    const parsed = parseCaip2(value);
    if (!parsed || parsed.namespace !== 'eip155') return undefined;
    const n = Number(parsed.reference);
    return Number.isInteger(n) && n > 0 ? n : undefined;
};

/**
 * Build the CAIP-2 representation for an EVM chain id.
 */
export const evmChainIdToCaip2 = (chainId: number | string): string => `eip155:${chainId}`;

export const isErrorResponse = (body: unknown): body is SwapsXyzErrorResponse => {
    return (
        typeof body === 'object' &&
        body !== null &&
        (body as { success?: unknown }).success === false &&
        typeof (body as { error?: unknown }).error === 'object'
    );
};

export const mapStatus = (status: string): CryptoOnrampStatus => {
    switch (status) {
        case 'success':
            return 'success';
        case 'pending':
            return 'pending';
        case 'failed':
        case 'requires refund':
        case 'refunded':
            return 'failed';
        default:
            return 'pending';
    }
};

export const isEvmAddress = (address: string): boolean => {
    return EVM_ADDRESS_REGEX.test(address);
};
