/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampStatus } from '../../../api/models';
import type { LayerswapErrorResponse, LayerswapSwapStatus } from './types';

const EVM_ADDRESS_REGEX = /^(0x)?[0-9a-fA-F]{40}$/;

export const ARBITRUM_CAIP2 = 'eip155:42161';
export const ARBITRUM_USDT0_ADDRESS = '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9';
export const TON_USDT_ADDRESS = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

export const LAYERSWAP_SOURCE_NETWORK = 'ARBITRUM_MAINNET';
export const LAYERSWAP_SOURCE_TOKEN = 'USDT0';
export const LAYERSWAP_DESTINATION_NETWORK = 'TON_MAINNET';
export const LAYERSWAP_DESTINATION_TOKEN = 'USDT';

export const isEvmAddress = (address: string): boolean => {
    return EVM_ADDRESS_REGEX.test(address);
};

export const isErrorResponse = (body: unknown): body is LayerswapErrorResponse => {
    return (
        typeof body === 'object' &&
        body !== null &&
        typeof (body as { error?: unknown }).error === 'object' &&
        (body as { error: { message?: unknown } }).error !== null
    );
};

export const mapStatus = (status: LayerswapSwapStatus | string): CryptoOnrampStatus => {
    switch (status) {
        case 'completed':
        case 'user_payout_completed':
        case 'payout_completed':
            return 'success';
        case 'user_transfer_pending':
        case 'user_transfer_delayed':
        case 'ls_transfer_pending':
        case 'initiated':
        case 'created':
            return 'pending';
        case 'expired':
        case 'failed':
        case 'cancelled':
        case 'refunded':
        case 'requires_refund':
            return 'failed';
        default:
            return 'pending';
    }
};

/**
 * Format a base-units integer string into a decimal token-units string.
 * e.g. formatBaseUnits('2000000', 6) === '2'.
 */
export const formatBaseUnits = (base: string, decimals: number): string => {
    if (!/^\d+$/.test(base)) {
        throw new Error(`formatBaseUnits: not a non-negative integer string: "${base}"`);
    }
    if (decimals === 0) return base;
    const padded = base.padStart(decimals + 1, '0');
    const whole = padded.slice(0, padded.length - decimals);
    const frac = padded.slice(padded.length - decimals).replace(/0+$/, '');
    return frac.length > 0 ? `${whole}.${frac}` : whole;
};

/**
 * Scale a decimal token-units string by 10^decimals and return the integer
 * base-units string, truncating any excess fractional digits.
 */
export const parseBaseUnits = (value: number | string, decimals: number): string => {
    const str = typeof value === 'number' ? value.toString() : value;
    if (!/^\d+(\.\d+)?$/.test(str)) {
        throw new Error(`parseBaseUnits: not a non-negative decimal: "${str}"`);
    }
    const [whole, frac = ''] = str.split('.');
    const truncated = frac.slice(0, decimals).padEnd(decimals, '0');
    const combined = `${whole}${truncated}`.replace(/^0+/, '');
    return combined.length > 0 ? combined : '0';
};
