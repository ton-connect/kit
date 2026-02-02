/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type { UserFriendlyAddress } from '../api/models';

export function asMaybeAddressFriendly(data?: string | null): UserFriendlyAddress | null {
    try {
        return asAddressFriendly(data);
    } catch {
        return null;
    }
}

export function asAddressFriendly(data?: Address | string | null): UserFriendlyAddress {
    if (data instanceof Address) {
        return data.toString() as UserFriendlyAddress;
    }
    try {
        if (data) return Address.parse(data).toString() as UserFriendlyAddress;
    } catch {
        /* empty */
    }
    throw new Error(`Can not convert to AddressFriendly from "${data}"`);
}

export function formatWalletAddress(address: string | Address, isTestnet: boolean = false): UserFriendlyAddress {
    if (typeof address === 'string') {
        return Address.parse(address).toString({ bounceable: false, testOnly: isTestnet }) as UserFriendlyAddress;
    }
    return address.toString({ bounceable: false, testOnly: isTestnet }) as UserFriendlyAddress;
}

export function isValidAddress(address: unknown): boolean {
    if (typeof address !== 'string') {
        return false;
    }

    try {
        Address.parse(address);
    } catch (_) {
        return false;
    }

    return true;
}

export function isFriendlyTonAddress(address: string): boolean {
    try {
        Address.parseFriendly(address);
    } catch (_) {
        return false;
    }

    return true;
}
