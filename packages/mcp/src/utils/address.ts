/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

export type McpAddressNetwork = 'mainnet' | 'testnet';

export function formatWalletAddress(address: string | Address, network: McpAddressNetwork): string {
    const parsed = typeof address === 'string' ? Address.parse(address) : address;
    return parsed.toString({ bounceable: false, testOnly: network === 'testnet' });
}

export function formatWalletAddressSafe(
    address: string | null | undefined,
    network: McpAddressNetwork,
): string | undefined {
    if (!address) {
        return undefined;
    }

    try {
        return formatWalletAddress(address, network);
    } catch {
        return address;
    }
}

export function formatAssetAddress(address: string | Address, network: McpAddressNetwork): string {
    const parsed = typeof address === 'string' ? Address.parse(address) : address;
    return parsed.toString({ bounceable: true, testOnly: network === 'testnet' });
}

export function formatAssetAddressSafe(
    address: string | null | undefined,
    network: McpAddressNetwork,
): string | undefined {
    if (!address) {
        return undefined;
    }

    try {
        return formatAssetAddress(address, network);
    } catch {
        return address;
    }
}

export function normalizeAddressForComparison(address: string): string | null {
    try {
        return Address.parse(address).toRawString();
    } catch {
        return null;
    }
}
