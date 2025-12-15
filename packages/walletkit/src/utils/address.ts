/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Address } from '@ton/core';

import { loadTonCore } from '../deps/tonCore';

export async function formatWalletAddress(address: string | Address, isTestnet: boolean = false): Promise<string> {
    const { Address: AddressClass } = await loadTonCore();
    if (typeof address === 'string') {
        return AddressClass.parse(address).toString({ bounceable: false, testOnly: isTestnet });
    }
    return address.toString({ bounceable: false, testOnly: isTestnet });
}

export async function isValidAddress(address: unknown): Promise<boolean> {
    if (typeof address !== 'string') {
        return false;
    }

    const { Address: AddressClass } = await loadTonCore();
    try {
        AddressClass.parse(address);
    } catch (_) {
        return false;
    }

    return true;
}

export async function isFriendlyTonAddress(address: string): Promise<boolean> {
    const { Address: AddressClass } = await loadTonCore();
    try {
        AddressClass.parseFriendly(address);
    } catch (_) {
        return false;
    }

    return true;
}
