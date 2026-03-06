/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

export function normalizeTonAddress(address: string | undefined | null): string | null {
    if (!address) {
        return null;
    }

    try {
        return Address.parse(address).toRawString();
    } catch {
        return null;
    }
}

export function isSameTonAddress(a: string | undefined | null, b: string | undefined | null): boolean {
    const na = normalizeTonAddress(a);
    const nb = normalizeTonAddress(b);

    if (na && nb) {
        return na === nb;
    }

    return (a ?? '').trim() === (b ?? '').trim();
}
