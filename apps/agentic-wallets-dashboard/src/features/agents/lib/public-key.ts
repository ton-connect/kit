/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const UINT_256_MAX = 1n << 256n;

export function parseUint256PublicKey(value: string): bigint {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error('Operator public key is required');
    }

    let parsed: bigint;
    if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
        parsed = BigInt(trimmed);
    } else if (/^\d+$/.test(trimmed)) {
        parsed = BigInt(trimmed);
    } else {
        throw new Error('Operator public key must be hex (0x...) or decimal');
    }

    if (parsed < 0n || parsed >= UINT_256_MAX) {
        throw new Error('Operator public key must fit uint256');
    }

    return parsed;
}
