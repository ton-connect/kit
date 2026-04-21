/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampStatus } from '../../../api/models';
import type { SwapsXyzErrorResponse } from './types';

const EVM_ADDRESS_REGEX = /^(0x)?[0-9a-fA-F]{40}$/;

export const parseChainId = (value: string): number | undefined => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
};

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
            throw new Error(`Unknown status: ${status}`);
    }
};

export const isEvmAddress = (address: string): boolean => {
    return EVM_ADDRESS_REGEX.test(address);
};
